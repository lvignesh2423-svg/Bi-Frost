from openai import AsyncOpenAI, APIStatusError, APIConnectionError
from backend.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, LLM_MODEL
import json
import re


client = AsyncOpenAI(
    api_key=OPENROUTER_API_KEY or "missing-openrouter-api-key",
    base_url=OPENROUTER_BASE_URL,
)


class LLMError(Exception):
    pass


async def chat_completion(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
    try:
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=4096,
        )
        return response.choices[0].message.content
    except APIStatusError as e:
        if e.status_code == 402:
            raise LLMError("API account has insufficient credits.")
        elif e.status_code == 401:
            raise LLMError("Invalid API key.")
        elif e.status_code == 429:
            raise LLMError("Rate limited. Please wait a moment and try again.")
        else:
            raise LLMError(f"API error {e.status_code}: {str(e)[:200]}")
    except APIConnectionError:
        raise LLMError("Could not connect to API. Check your internet connection.")
    except Exception as e:
        raise LLMError(f"LLM error: {str(e)[:200]}")


async def chat_completion_json(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> dict:
    raw = await chat_completion(system_prompt, user_prompt, temperature)
    return _parse_json_response(raw)


def _parse_json_response(raw: str) -> dict:
    # Step 1: Strip think blocks
    text = re.sub(r'<think>[\s\S]*?</think>', '', raw, flags=re.IGNORECASE).strip()
    text = re.sub(r'<reasoning>[\s\S]*?</reasoning>', '', text, flags=re.IGNORECASE).strip()
    # Strip trailing unclosed think
    text = re.sub(r'<think>[\s\S]*$', '', text, flags=re.IGNORECASE).strip()

    # Step 2: Extract from code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        text = match.group(1).strip()

    # Step 3: Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Step 4: Find outermost { }
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        candidate = text[start:end]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # Fix trailing commas
            fixed = re.sub(r',\s*}', '}', candidate)
            fixed = re.sub(r',\s*]', ']', fixed)
            try:
                return json.loads(fixed)
            except json.JSONDecodeError:
                pass

            # Fix missing quotes on keys
            fixed2 = re.sub(r'(?<={|,)\s*(\w+)\s*:', r' "\1":', candidate)
            fixed2 = re.sub(r',\s*}', '}', fixed2)
            try:
                return json.loads(fixed2)
            except json.JSONDecodeError:
                pass

    # Step 5: Try [ ]
    start = text.find("[")
    end = text.rfind("]") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    # Step 6: Extract JSON between first { and last } using regex
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        candidate = json_match.group(0)
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            fixed = re.sub(r',\s*}', '}', candidate)
            fixed = re.sub(r',\s*]', ']', fixed)
            try:
                return json.loads(fixed)
            except json.JSONDecodeError:
                pass

    raise ValueError(f"Could not parse JSON from LLM response: {raw[:500]}")


async def chat_completion_stream(system_prompt: str, user_prompt: str, temperature: float = 0.5):
    stream = await client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=2048,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
