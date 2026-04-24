







import asyncio
import json
import logging
import os
from typing import Any


from google import genai
from groq import Groq


logger = logging.getLogger(__name__)
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))


GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
client = genai.Client(api_key=GOOGLE_API_KEY)
MODEL_ID = "gemini-2.5-flash"


async def generate_with_fallback(prompt: str, system_instruction: str = None, is_json: bool = False, history: list = None) -> tuple[str, bool]:
    """
    Attempts to generate content with Gemini. If it fails, falls back to Groq (llama3-70b-8192).
    Returns a tuple of (response_text, fallback_used).
    Cycles at most once (Gemini -> Groq).
    """
    fallback_used = False
    try:
        kwargs = {"model": MODEL_ID}
        if is_json:
            kwargs["config"] = {"response_mime_type": "application/json"}
        
        full_contents = []
        if history:
            full_contents.extend(history)
        
        if system_instruction:
            full_contents.append({"role": "user", "parts": [{"text": f"{system_instruction}\n\nUser: {prompt}"}]})
        elif prompt:
            full_contents.append({"role": "user", "parts": [{"text": prompt}]})
            
        kwargs["contents"] = full_contents

        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: client.models.generate_content(**kwargs)
            ),
            timeout=120.0
        )
        return response.text, fallback_used
    except Exception as e:
        logger.warning(f"Gemini failed: {str(e)}. Falling back to Groq Llama-70b...")
        fallback_used = True
        
        messages = []
        
        sys_msg = system_instruction or ""
        if is_json:
            json_inst = "Return ONLY valid JSON. Do not include markdown formatting or explanations."
            sys_msg = f"{sys_msg}\n\n{json_inst}" if sys_msg else json_inst
            
        if sys_msg:
            messages.append({"role": "system", "content": sys_msg})
            
        if history:
            for msg in history:
                role = "assistant" if msg["role"] == "model" else "user"
                messages.append({"role": role, "content": msg["parts"][0]["text"]})
                
        if prompt:
            messages.append({"role": "user", "content": prompt})

        groq_response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    response_format={"type": "json_object"} if is_json else None
                )
            ),
            timeout=120.0
        )
        
        return groq_response.choices[0].message.content, fallback_used


def sanitize_analysis_result(raw_data: Any) -> dict:
    """
    Validates and cleans the raw JSON response from the AI model.
    
    This function ensures that mandatory fields exist and are of the correct type
    (strings vs lists), preventing the frontend from crashing due to unexpected 
    nulls or malformed data structures.
    
    Args:
        raw_data: The unprocessed JSON-like output from Gemini.
    Returns:
        A dictionary containing sanitized strings and lists.
    """
    if not isinstance(raw_data, dict):
        return {}

    strings = ["overview", "analysis", "yaml_config"]
    lists = ["tech_stack", "implementation_steps", "benefits"]
    
    clean_data = {}

    for field in strings:
        val = raw_data.get(field, "")
        if isinstance(val, (dict, list)):
            clean_data[field] = json.dumps(val)
        else:
            clean_data[field] = str(val) if val is not None else ""

    for field in lists:
        val = raw_data.get(field, [])
        if isinstance(val, str):
            try:
                parsed = json.loads(val.replace("'", '"'))
                clean_data[field] = parsed if isinstance(parsed, list) else [val]
            except:
                clean_data[field] = [val]
        elif isinstance(val, list):
            clean_data[field] = val
        else:
            clean_data[field] = []


    return clean_data