from backend.services.llm_client import chat_completion_json, LLMError
from backend.models.schemas import ResumeRewrite
import asyncio


RESUME_REWRITE_PROMPT = """You are an expert resume writer and ATS (Applicant Tracking System) optimizer.

Rewrite the user's resume bullet points to better match the target job description.

Return a JSON object with this EXACT structure:
{
  "rewrites": [
    {
      "original_bullet": "Original bullet point text",
      "rewritten_bullet": "Optimized bullet point text",
      "keywords_added": ["keyword1", "keyword2"]
    }
  ]
}

Rules:
- Only rewrite if the bullet can be improved with relevant keywords
- Keep the rewrite truthful — enhance language, don't fabricate experience
- Use action verbs and quantified results where possible
- Add industry-standard keywords from the job description
- Maintain the original meaning and accomplishments
- If a bullet is already well-written, keep it as-is
- Return ONLY valid JSON"""


async def rewrite_resume(
    resume_text: str,
    target_job_title: str,
    target_job_description: str = None,
) -> list:
    job_context = f"Target Job: {target_job_title}"
    if target_job_description:
        job_context += f"\nJob Description:\n{target_job_description[:3000]}"

    user_prompt = f"""{job_context}

Resume content to optimize:
{resume_text[:6000]}

Rewrite the bullet points to match this job."""

    last_error = None
    for attempt in range(3):
        try:
            result = await chat_completion_json(RESUME_REWRITE_PROMPT, user_prompt)
            rewrites = []
            for r in result.get("rewrites", []):
                if isinstance(r, dict) and "original_bullet" in r and "rewritten_bullet" in r:
                    rewrites.append(ResumeRewrite(
                        original_bullet=r["original_bullet"],
                        rewritten_bullet=r["rewritten_bullet"],
                        keywords_added=r.get("keywords_added", []),
                    ))
            if rewrites:
                return rewrites
            last_error = ValueError("No valid rewrites in response")
        except (LLMError, ValueError, KeyError) as e:
            last_error = e
            if attempt < 2:
                await asyncio.sleep(2 * (attempt + 1))

    raise last_error or LLMError("Failed to optimize resume after multiple attempts")
