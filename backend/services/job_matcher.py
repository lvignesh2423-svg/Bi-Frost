from services.llm_client import chat_completion_json
from models.schemas import (
    ResumeData, SkillGap, SkillCategory, SkillLevel,
    ExtractedSkill, AnalysisResult, LearningStep, RoadmapNode
)
import uuid

GAP_ANALYSIS_PROMPT = """You are a career analysis expert. Write an assessment addressing the user directly in 2nd person.

CRITICAL: The "summary" field MUST be written in 2nd person. Use "You" not "I" or "the candidate". Example: "You have 3 years of Python experience but need to develop machine learning skills."

Return a JSON object with this EXACT structure:
{
  "readiness_score": 72.0,
  "related_jobs": ["Related Job Title 1", "Related Job Title 2", "Related Job Title 3"],
  "skill_gaps": [
    {
      "skill_name": "Missing Skill",
      "category": "hard" or "soft" or "certification",
      "required_level": "beginner" or "intermediate" or "advanced" or "expert",
      "current_level": "beginner" or "intermediate" or "advanced" or "expert" or null,
      "is_missing": true,
      "importance": "high" or "medium" or "low",
      "estimated_hours": 40,
      "learning_resources": ["Resource name and brief description"]
    }
  ],
  "bonus_skills": [
    {
      "skill_name": "Enhancement Skill",
      "category": "hard",
      "description": "Why this skill enhances your candidacy",
      "related_jobs": ["Job titles where this helps"],
      "estimated_hours": 20
    }
  ],
  "matched_skills": [
    {
      "name": "Skill Name",
      "category": "hard",
      "level": "advanced",
      "years_experience": 3.0,
      "confidence": 0.9
    }
  ],
  "summary": "2-3 sentence overall assessment written in 2nd person (use 'You')"
}

Rules:
- The summary field MUST start with "You" — for example "You have a solid foundation in..." or "You are well-qualified for..."
- readiness_score: percentage (0-100) of how ready the candidate is
- related_jobs: 3-5 job titles similar to the target that this candidate could also pursue
- Include BOTH missing skills AND partially matched skills (where candidate has it but needs improvement)
- estimated_hours: realistic hours to reach required level from current level
- learning_resources: 1-2 specific resources per skill (course name, book, or project)
- bonus_skills: 3-6 skills that are NOT strictly required but would significantly boost the candidate's chances. These should be skills that are trending, in high demand, or would differentiate the candidate from other applicants. Include why each bonus skill matters and which related jobs value it.
- Be honest but encouraging in the summary
- Return ONLY valid JSON"""


LEARNING_PATH_PROMPT = """You are a career coach. Create a step-by-step learning path to fill skill gaps.

Return a JSON object with this EXACT structure:
{
  "learning_path": [
    {
      "step_number": 1,
      "title": "Step Title",
      "description": "What to learn and why",
      "estimated_hours": 20,
      "resources": [
        {"name": "Resource Name", "type": "course" or "book" or "project" or "video", "description": "Brief description"}
      ],
      "projects": ["Specific project to build"]
    }
  ]
}

Rules:
- Order steps logically (prerequisites first)
- Each step should focus on 1-2 related skills
- Include specific projects to build for practice
- Be realistic with time estimates
- 5-10 steps total
- Return ONLY valid JSON"""


ROADMAP_PROMPT = """You are a visual learning roadmap designer. Create nodes for a visual learning roadmap.

Return a JSON object with this EXACT structure:
{
  "roadmap_nodes": [
    {
      "id": "unique-id",
      "title": "Node Title",
      "description": "Brief description",
      "skill": "Related skill name",
      "duration_hours": 20,
      "prerequisites": ["id-of-prerequisite-node"],
      "resources": [{"name": "Resource Name", "type": "course"}],
      "x": 0.5,
      "y": 0.1
    }
  ]
}

Rules:
- x and y should be between 0 and 1 (normalized coordinates for positioning)
- Arrange nodes left-to-right or top-to-bottom
- prerequisite nodes should have lower x/y values than dependent nodes
- Include 6-12 nodes
- Each node represents a learning milestone
- Return ONLY valid JSON"""


async def analyze_skill_gaps(
    resume_data: ResumeData,
    target_job_title: str,
    target_job_description: str = None,
) -> AnalysisResult:
    job_context = f"Target Job Title: {target_job_title}"
    if target_job_description:
        job_context += f"\n\nJob Description:\n{target_job_description}"

    skills_text = "\n".join([
        f"- {s.name} ({s.category.value}, {s.level.value}, {s.years_experience or '?'} years)"
        for s in resume_data.skills
    ])

    user_prompt = f"""{job_context}

Candidate Profile:
- Name: {resume_data.name or 'Unknown'}
- Experience: {resume_data.experience_years or 'Unknown'} years
- Education: {', '.join(resume_data.education) if resume_data.education else 'Not specified'}
- Certifications: {', '.join(resume_data.certifications) if resume_data.certifications else 'None'}

Current Skills:
{skills_text}

Analyze the gap between this candidate and the target job."""

    result = await chat_completion_json(GAP_ANALYSIS_PROMPT, user_prompt)

    skill_gaps = []
    for gap in result.get("skill_gaps", []):
        try:
            req_level = SkillLevel(gap.get("required_level", "intermediate"))
        except ValueError:
            req_level = SkillLevel.INTERMEDIATE
        try:
            curr_level = SkillLevel(gap.get("current_level", "beginner")) if gap.get("current_level") else None
        except ValueError:
            curr_level = None
        try:
            category = SkillCategory(gap.get("category", "hard"))
        except ValueError:
            category = SkillCategory.HARD

        skill_gaps.append(SkillGap(
            skill_name=gap["skill_name"],
            category=category,
            required_level=req_level,
            current_level=curr_level,
            is_missing=gap.get("is_missing", True),
            importance=gap.get("importance", "high"),
            estimated_hours=gap.get("estimated_hours", 20),
            learning_resources=gap.get("learning_resources", []),
        ))

    matched_skills = []
    for ms in result.get("matched_skills", []):
        try:
            level = SkillLevel(ms.get("level", "intermediate"))
        except ValueError:
            level = SkillLevel.INTERMEDIATE
        try:
            cat = SkillCategory(ms.get("category", "hard"))
        except ValueError:
            cat = SkillCategory.HARD
        matched_skills.append(ExtractedSkill(
            name=ms["name"],
            category=cat,
            level=level,
            years_experience=ms.get("years_experience"),
            confidence=ms.get("confidence", 0.8),
        ))

    return AnalysisResult(
        readiness_score=result.get("readiness_score", 0),
        total_skills_required=len(skill_gaps) + len(matched_skills),
        skills_matched=len(matched_skills),
        skills_missing=len([g for g in skill_gaps if g.is_missing]),
        skill_gaps=skill_gaps,
        matched_skills=matched_skills,
        summary=result.get("summary", ""),
        related_jobs=result.get("related_jobs", []),
        bonus_skills=result.get("bonus_skills", []),
    )


async def generate_learning_path(skill_gaps: list, resume_data: ResumeData) -> list:
    gaps_text = "\n".join([
        f"- {g.skill_name} ({g.category.value}, required: {g.required_level.value}, est: {g.estimated_hours}h)"
        for g in skill_gaps
    ])
    skills_text = ", ".join([s.name for s in resume_data.skills])

    user_prompt = f"""Candidate has: {skills_text}
Needs to learn:
{gaps_text}

Create a step-by-step learning path."""

    result = await chat_completion_json(LEARNING_PATH_PROMPT, user_prompt)

    steps = []
    for step in result.get("learning_path", []):
        steps.append(LearningStep(
            step_number=step["step_number"],
            title=step["title"],
            description=step["description"],
            estimated_hours=step.get("estimated_hours", 10),
            resources=step.get("resources", []),
            projects=step.get("projects", []),
        ))
    return steps


async def generate_roadmap(skill_gaps: list, resume_data: ResumeData) -> list:
    gaps_text = "\n".join([
        f"- {g.skill_name} ({g.category.value}, {g.estimated_hours}h)"
        for g in skill_gaps
    ])

    user_prompt = f"Skills to learn: {gaps_text}\nCreate a visual roadmap with nodes and coordinates."

    result = await chat_completion_json(ROADMAP_PROMPT, user_prompt)

    nodes = []
    for node in result.get("roadmap_nodes", []):
        nodes.append(RoadmapNode(
            id=node.get("id", str(uuid.uuid4())[:8]),
            title=node["title"],
            description=node["description"],
            skill=node["skill"],
            duration_hours=node.get("duration_hours", 10),
            prerequisites=node.get("prerequisites", []),
            resources=node.get("resources", []),
            x=node.get("x", 0.5),
            y=node.get("y", 0.5),
        ))
    return nodes
