from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class SkillCategory(str, Enum):
    HARD = "hard"
    SOFT = "soft"
    CERTIFICATION = "certification"


class ExtractedSkill(BaseModel):
    name: str
    category: SkillCategory
    level: SkillLevel
    years_experience: Optional[float] = None
    confidence: float = 0.8


class ResumeData(BaseModel):
    raw_text: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[ExtractedSkill] = []
    experience_years: Optional[float] = None
    education: List[str] = []
    certifications: List[str] = []
    projects: List[str] = []


class SkillGap(BaseModel):
    skill_name: str
    category: SkillCategory
    required_level: SkillLevel
    current_level: Optional[SkillLevel] = None
    is_missing: bool = True
    importance: str = "high"
    learning_resources: List[str] = []
    estimated_hours: int = 0


class RoadmapNode(BaseModel):
    id: str
    title: str
    description: str
    skill: str
    duration_hours: int
    prerequisites: List[str] = []
    resources: List[Dict[str, str]] = []
    status: str = "not_started"
    x: float = 0
    y: float = 0


class LearningStep(BaseModel):
    step_number: int
    title: str
    description: str
    resources: List[Dict[str, str]] = []
    estimated_hours: int
    projects: List[str] = []


class AnalysisResult(BaseModel):
    readiness_score: float
    total_skills_required: int
    skills_matched: int
    skills_missing: int
    skill_gaps: List[SkillGap]
    matched_skills: List[ExtractedSkill]
    learning_path: List[LearningStep] = []
    roadmap_nodes: List[RoadmapNode] = []
    time_to_hire_weeks: int = 0
    study_hours_per_week: int = 10
    summary: str = ""
    related_jobs: List[str] = []
    bonus_skills: List[Dict[str, Any]] = []


class ResumeRewrite(BaseModel):
    original_bullet: str
    rewritten_bullet: str
    keywords_added: List[str] = []


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = []


class AnalyzeRequest(BaseModel):
    resume_text: str
    target_job_title: str
    target_job_description: Optional[str] = None
    years_experience: Optional[float] = None
    study_hours_per_week: int = 10
    completed_skills: List[str] = []
    updated_resume_text: Optional[str] = None


class ProgressUpdate(BaseModel):
    skill_name: str
    completed: bool = True
