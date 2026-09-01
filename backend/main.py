from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
import json
import os
import time

from backend.config import FRONTEND_DIR
from backend.models.schemas import (
    AnalyzeRequest, ChatRequest, ChatMessage, ProgressUpdate
)
from backend.models.database import init_db, get_db, AnalysisHistory
from backend.models.user import User, UserAnalysis
from backend.services.resume_parser import extract_text_from_uploaded
from backend.services.skill_extractor import extract_skills_from_resume
from backend.services.job_matcher import analyze_skill_gaps, generate_learning_path, generate_roadmap
from backend.services.resume_rewriter import rewrite_resume
from backend.services.llm_client import chat_completion, LLMError
from backend.services.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_optional_user
)

app = FastAPI(title="AI Skill Gap Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ──────────────────────────────────────────────
# AUTH ENDPOINTS
# ──────────────────────────────────────────────

@app.post("/api/auth/register")
def register(data: dict, db: Session = Depends(get_db)):
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if not password or len(password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(username=username, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"token": token, "username": user.username, "user_id": user.id}


@app.post("/api/auth/login")
def login(data: dict, db: Session = Depends(get_db)):
    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": str(user.id)})
    return {"token": token, "username": user.username, "user_id": user.id}


@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {"user_id": user.id, "username": user.username}


# ──────────────────────────────────────────────
# HEALTH
# ──────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AI Skill Gap Analyzer"}


# ──────────────────────────────────────────────
# RESUME UPLOAD + ANALYSIS
# ──────────────────────────────────────────────

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    start = time.time()
    contents = await file.read()
    resume_text = extract_text_from_uploaded(contents, file.filename)

    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract meaningful text from the file.")

    try:
        resume_data = await extract_skills_from_resume(resume_text)
    except LLMError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return {
        "resume_text": resume_text,
        "name": resume_data.name,
        "email": resume_data.email,
        "phone": resume_data.phone,
        "skills": [s.model_dump() for s in resume_data.skills],
        "experience_years": resume_data.experience_years,
        "education": resume_data.education,
        "certifications": resume_data.certifications,
        "projects": resume_data.projects,
        "processing_time": round(time.time() - start, 2),
    }


@app.post("/api/analyze")
async def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_optional_user),
):
    start = time.time()
    session_id = str(uuid.uuid4())[:8]

    try:
        resume_data = await extract_skills_from_resume(request.resume_text)
    except (LLMError, ValueError) as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        analysis = await analyze_skill_gaps(
            resume_data,
            request.target_job_title,
            request.target_job_description,
        )

        learning_path = await generate_learning_path(analysis.skill_gaps, resume_data)
        analysis.learning_path = learning_path

        roadmap_nodes = await generate_roadmap(analysis.skill_gaps, resume_data)
        analysis.roadmap_nodes = roadmap_nodes
    except (LLMError, ValueError) as e:
        raise HTTPException(status_code=503, detail=str(e))

    if request.study_hours_per_week > 0 and analysis.skill_gaps:
        total_hours = sum(g.estimated_hours for g in analysis.skill_gaps)
        analysis.study_hours_per_week = request.study_hours_per_week
        analysis.time_to_hire_weeks = max(1, round(total_hours / request.study_hours_per_week))

    if user:
        record = UserAnalysis(
            user_id=user.id,
            session_id=session_id,
            name=resume_data.name,
            target_job=request.target_job_title,
            readiness_score=int(analysis.readiness_score),
            skills_matched=analysis.skills_matched,
            skills_missing=analysis.skills_missing,
            resume_text=request.resume_text[:5000],
            analysis_json=json.dumps(analysis.model_dump(), default=str),
        )
        db.add(record)
        db.commit()

    return {
        "session_id": session_id,
        "analysis": analysis.model_dump(),
        "processing_time": round(time.time() - start, 2),
    }


# ──────────────────────────────────────────────
# PROGRESS TRACKING
# ──────────────────────────────────────────────

@app.post("/api/progress/{session_id}")
def update_progress(
    session_id: str,
    update: ProgressUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(UserAnalysis).filter(
        UserAnalysis.session_id == session_id,
        UserAnalysis.user_id == user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    completed = json.loads(record.completed_skills) if record.completed_skills else []
    skill = update.skill_name.strip()

    if update.completed and skill not in completed:
        completed.append(skill)
    elif not update.completed and skill in completed:
        completed.remove(skill)

    record.completed_skills = json.dumps(completed)

    analysis_data = json.loads(record.analysis_json) if record.analysis_json else {}
    total_gaps = len(analysis_data.get("skill_gaps", []))
    if total_gaps > 0:
        new_score = min(100, int((len(completed) / total_gaps) * 100) + analysis_data.get("readiness_score", 0) // 2)
        record.readiness_score = min(100, new_score)
        analysis_data["readiness_score"] = record.readiness_score
        record.analysis_json = json.dumps(analysis_data, default=str)

    db.commit()

    return {
        "session_id": session_id,
        "completed_skills": completed,
        "readiness_score": record.readiness_score,
    }


@app.get("/api/progress/{session_id}")
def get_progress(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(UserAnalysis).filter(
        UserAnalysis.session_id == session_id,
        UserAnalysis.user_id == user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "session_id": session_id,
        "completed_skills": json.loads(record.completed_skills) if record.completed_skills else [],
        "readiness_score": record.readiness_score,
    }


# ──────────────────────────────────────────────
# RESUME GENERATION (DOWNLOAD)
# ──────────────────────────────────────────────

@app.post("/api/generate-resume")
async def generate_resume(request: AnalyzeRequest):
    resume_text = request.updated_resume_text or request.resume_text
    completed_skills = request.completed_skills or []
    lines = resume_text.strip().split('\n')

    name = lines[0].strip() if lines else 'Your Name'
    email = ''
    phone = ''
    for line in lines[:10]:
        if '@' in line and not email:
            email = line.strip()
        if any(c.isdigit() for c in line) and ('phone' in line.lower() or '-' in line) and not phone:
            phone = line.strip()

    skills_section = []
    education_section = []
    cert_section = []
    experience_lines = []
    in_skills = False
    in_education = False
    in_certs = False
    in_experience = False

    for line in lines:
        lower = line.lower().strip()
        if 'skill' in lower and ':' in lower:
            in_skills = True
            in_experience = False
            parts = line.split(':', 1)
            if len(parts) > 1 and parts[1].strip():
                skills_section.extend([s.strip() for s in parts[1].split(',') if s.strip()])
            continue
        if 'education' in lower:
            in_skills = False
            in_education = True
            in_experience = False
            continue
        if 'certif' in lower:
            in_education = False
            in_certs = True
            in_experience = False
            continue
        if lower.startswith(('experience', 'work history', 'employment')):
            in_skills = False
            in_education = False
            in_certs = False
            in_experience = True
            continue

        if in_skills and line.strip():
            skills_section.extend([s.strip() for s in line.replace('-', '').split(',') if s.strip()])
        elif in_education and line.strip():
            education_section.append(line.strip().lstrip('- ').strip())
        elif in_certs and line.strip():
            cert_section.append(line.strip().lstrip('- ').strip())
        elif in_experience and line.strip():
            experience_lines.append(line.strip().lstrip('- ').strip())

    if not skills_section:
        for line in lines:
            if any(kw in line.lower() for kw in ['python', 'javascript', 'java', 'sql', 'git', 'react', 'node', 'flask', 'django']):
                skills_section.extend([s.strip() for s in line.split(',') if s.strip()])

    all_skills = list(set(skills_section + completed_skills))

    original_set = set(skills_section)
    new_skills_set = set(completed_skills) - original_set

    skill_tags = []
    for s in all_skills:
        cls = 'skill-tag new' if s in new_skills_set else 'skill-tag'
        skill_tags.append(f'<span class="{cls}">{s}</span>')
    skill_list_html = '\n        '.join(skill_tags)

    education_html = '\n        '.join(f'<li>{e}</li>' for e in education_section)
    cert_html = '\n        '.join(f'<li>{c}</li>' for c in cert_section)
    exp_html = '\n        '.join(f'<li>{e}</li>' for e in experience_lines) if experience_lines else ''

    html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<style>
  @page {{ margin: 0; size: A4; }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #2d2d2d;
    line-height: 1.6;
    padding: 48px 56px;
    background: #fff;
    max-width: 800px;
    margin: 0 auto;
  }}
  .header {{
    text-align: center;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2.5px solid #1a1a2e;
  }}
  .header h1 {{
    font-size: 32px;
    color: #1a1a2e;
    margin-bottom: 8px;
    letter-spacing: 1px;
    font-weight: 700;
  }}
  .header .contact {{
    font-size: 13px;
    color: #555;
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }}
  .header .contact span {{
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }}
  .section {{
    margin-bottom: 22px;
  }}
  .section h2 {{
    font-size: 14px;
    color: #1a1a2e;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 1.5px solid #e0e0e0;
    padding-bottom: 6px;
    margin-bottom: 12px;
    font-weight: 700;
  }}
  .skills-grid {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }}
  .skill-tag {{
    background: #f0f4f8;
    color: #334155;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid #cbd5e1;
    font-family: 'Segoe UI', Arial, sans-serif;
  }}
  .skill-tag.new {{
    background: #ecfdf5;
    color: #065f46;
    border: 1.5px solid #34d399;
    font-weight: 600;
    box-shadow: 0 0 8px rgba(52, 211, 153, 0.2);
  }}
  ul {{
    padding-left: 22px;
  }}
  li {{
    font-size: 13.5px;
    margin-bottom: 5px;
    color: #374151;
    line-height: 1.5;
  }}
  li::marker {{
    color: #9ca3af;
  }}
  .exp-years {{
    font-size: 13px;
    color: #555;
    font-style: italic;
    margin-bottom: 8px;
  }}
  .footer-note {{
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
    font-style: italic;
    font-family: 'Segoe UI', Arial, sans-serif;
  }}
  @media print {{
    body {{ padding: 36px 48px; }}
    .skill-tag.new {{ box-shadow: none; border-color: #059669; }}
  }}
</style></head><body>
  <div class="header">
    <h1>{name}</h1>
    <div class="contact">
      {'<span>✉ ' + email + '</span>' if email else ''}
      {'<span>☎ ' + phone + '</span>' if phone else ''}
    </div>
  </div>

  <div class="section">
    <h2>Skills</h2>
    <div class="skills-grid">
        {skill_list_html}
    </div>
  </div>

  {'<div class="section"><h2>Experience</h2><ul>' + exp_html + '</ul></div>' if exp_html else ''}

  {'<div class="section"><h2>Education</h2><ul>' + education_html + '</ul></div>' if education_html else ''}

  {'<div class="section"><h2>Certifications</h2><ul>' + cert_html + '</ul></div>' if cert_html else ''}

  {'<div class="footer-note">Skills highlighted in green were added through your learning path.</div>' if new_skills_set else ''}
</body></html>"""

    return {"html": html, "skills_count": len(all_skills), "new_skills": list(new_skills_set)}


@app.post("/api/download-resume")
async def download_resume(request: AnalyzeRequest):
    result = await generate_resume(request)
    return HTMLResponse(content=result["html"], media_type="text/html")


# ──────────────────────────────────────────────
# RESUME REWRITE
# ──────────────────────────────────────────────

@app.post("/api/rewrite-resume")
async def rewrite_resume_endpoint(request: AnalyzeRequest):
    try:
        rewrites = await rewrite_resume(
            request.updated_resume_text or request.resume_text,
            request.target_job_title,
            request.target_job_description,
        )
        return {"rewrites": [r.model_dump() for r in rewrites]}
    except LLMError as e:
        raise HTTPException(status_code=503, detail=f"Optimization failed: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=503, detail=f"Could not parse optimization result: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)[:200]}")


# ──────────────────────────────────────────────
# AI MENTOR CHAT
# ──────────────────────────────────────────────

MENTOR_SYSTEM_PROMPT = """You are an expert AI career mentor. You help users with career transitions, skill development, and job search strategy.

Context about the user:
{context}

FORMATTING RULES (CRITICAL — follow exactly):
- Use **bold** for key terms and skill names
- Use ### for section headers when explaining concepts
- Use numbered lists (1. 2. 3.) for step-by-step instructions
- Use bullet points (-) for lists of items
- Use `code formatting` for technical terms, tools, and languages
- Keep paragraphs short (2-3 sentences max)
- Add blank lines between sections
- Start with a brief direct answer, then elaborate

CONTENT RULES:
- Answer specifically about THIS user's situation, not generic advice
- Reference their specific skills, gaps, and learning path
- Be encouraging but honest
- Suggest specific actions they can take
- If they ask about a skill gap, explain what it is and how to learn it given their background
- Keep responses concise and actionable
- Use real-world examples when possible"""


@app.post("/api/mentor-chat")
async def mentor_chat(request: ChatRequest):
    context = ""
    if request.context:
        context = json.dumps(request.context, indent=2, default=str)[:4000]

    messages = [
        {"role": "system", "content": MENTOR_SYSTEM_PROMPT.format(context=context)}
    ]

    for msg in request.history[-10:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    from backend.services.llm_client import client
    from backend.config import LLM_MODEL

    try:
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.5,
            max_tokens=1500,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)[:200]}")

    suggestions = []
    if "gap" in request.message.lower() or "skill" in request.message.lower():
        suggestions = [
            "How long will it take to learn this skill?",
            "What projects should I build?",
            "Can you suggest resources?"
        ]
    elif "resume" in request.message.lower():
        suggestions = [
            "Rewrite my resume for this job",
            "What keywords am I missing?",
            "How to quantify my achievements?"
        ]
    else:
        suggestions = [
            "What should I focus on first?",
            "Am I ready to apply?",
            "What are my strongest skills?"
        ]

    return {"reply": reply, "suggestions": suggestions}


# ──────────────────────────────────────────────
# HISTORY
# ──────────────────────────────────────────────

@app.get("/api/history")
def get_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_optional_user),
):
    if user:
        records = db.query(UserAnalysis).filter(
            UserAnalysis.user_id == user.id
        ).order_by(UserAnalysis.created_at.desc()).limit(20).all()
    else:
        records = db.query(AnalysisHistory).order_by(
            AnalysisHistory.created_at.desc()
        ).limit(20).all()

    return [
        {
            "session_id": r.session_id,
            "name": r.name,
            "target_job": r.target_job,
            "readiness_score": r.readiness_score,
            "skills_matched": r.skills_matched,
            "skills_missing": r.skills_missing,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@app.get("/api/history/{session_id}")
def get_analysis_detail(session_id: str, db: Session = Depends(get_db)):
    record = db.query(AnalysisHistory).filter(AnalysisHistory.session_id == session_id).first()
    if not record:
        record = db.query(UserAnalysis).filter(UserAnalysis.session_id == session_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "session_id": record.session_id,
        "name": record.name,
        "target_job": record.target_job,
        "analysis": json.loads(record.analysis_json) if record.analysis_json else None,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


@app.get("/api/latest-analysis")
def get_latest_analysis(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(UserAnalysis).filter(
        UserAnalysis.user_id == user.id
    ).order_by(UserAnalysis.created_at.desc()).first()

    if not record:
        return {"found": False}

    analysis_data = json.loads(record.analysis_json) if record.analysis_json else {}
    completed = json.loads(record.completed_skills) if record.completed_skills else []

    return {
        "found": True,
        "session_id": record.session_id,
        "resume_text": record.resume_text,
        "target_job": record.target_job,
        "readiness_score": record.readiness_score,
        "completed_skills": completed,
        "analysis": analysis_data,
    }


# ──────────────────────────────────────────────
# STATIC FILES
# ──────────────────────────────────────────────

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/{path:path}")
async def serve_static(path: str):
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
