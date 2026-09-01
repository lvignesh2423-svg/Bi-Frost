import json
from services.llm_client import chat_completion_json
from models.schemas import ExtractedSkill, SkillCategory, SkillLevel, ResumeData
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def load_taxonomy():
    with open(os.path.join(DATA_DIR, "skills_taxonomy.json"), "r") as f:
        return json.load(f)


SKILL_EXTRACTION_PROMPT = """You are an expert resume analyzer. Extract ALL information from this resume.

Return a JSON object with this EXACT structure:
{
  "name": "Full Name",
  "email": "email or null",
  "phone": "phone or null",
  "experience_years": 5.0,
  "skills": [
    {
      "name": "Skill Name",
      "category": "hard" or "soft" or "certification",
      "level": "beginner" or "intermediate" or "advanced" or "expert",
      "years_experience": 3.0
    }
  ],
  "education": ["Degree - University - Year"],
  "certifications": ["Certification Name"],
  "projects": ["Brief project description"]
}

Rules:
- Extract EVERY skill mentioned, even implied ones (e.g., "managed a team" implies Leadership, Team Management)
- Be specific: "React" not just "frontend", "PostgreSQL" not just "database"
- Infer skill levels from context (years mentioned, seniority, complexity of work)
- Include soft skills found in the resume
- If information is not found, use null
- Return ONLY valid JSON, no explanation"""


async def extract_skills_from_resume(resume_text: str) -> ResumeData:
    result = await chat_completion_json(
        SKILL_EXTRACTION_PROMPT,
        f"Extract all information from this resume:\n\n{resume_text[:8000]}"
    )

    skills = []
    for s in result.get("skills", []):
        try:
            level = SkillLevel(s.get("level", "intermediate"))
        except ValueError:
            level = SkillLevel.INTERMEDIATE
        try:
            category = SkillCategory(s.get("category", "hard"))
        except ValueError:
            category = SkillCategory.HARD

        skills.append(ExtractedSkill(
            name=s["name"],
            category=category,
            level=level,
            years_experience=s.get("years_experience"),
            confidence=0.85,
        ))

    return ResumeData(
        raw_text=resume_text,
        name=result.get("name"),
        email=result.get("email"),
        phone=result.get("phone"),
        skills=skills,
        experience_years=result.get("experience_years"),
        education=result.get("education", []),
        certifications=result.get("certifications", []),
        projects=result.get("projects", []),
    )
