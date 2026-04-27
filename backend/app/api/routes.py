import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import RepoRequest, ChatRequest, YamlRequest
from app.services.repo_service import analyze_repository
from app.services.ai_service import generate_with_gemini, generate_with_groq, sanitize_analysis_result
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


analysis_jobs = {}

@router.get("/")
async def read_root():
    return {"status": "Auto-Ops Agent API is active"}

@router.post("/analyze")
async def start_analysis(request: RepoRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    logger.info(f"Received analysis request for {request.url}. Job ID: {job_id}")
    
    analysis_jobs[job_id] = {"status": "pending", "result": None, "error": None}

    background_tasks.add_task(analyze_repository, request.url.strip(), job_id, analysis_jobs, getattr(request, "ai", "gemini"))
    
    return {"jobId": job_id}

@router.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return analysis_jobs[job_id]

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        history = []
        for msg in request.history:
            if msg.parts and msg.parts[0].text:
                history.append({
                    "role": "user" if msg.role == "user" else "model",
                    "parts": [{"text": msg.parts[0].text}]
                })

        system_instruction = (
            "You are Auto-Ops AI, a professional Senior DevOps Assistant. "
            f"CURRENT PROJECT YAML:\n{request.context}\n"
        )

        ai = getattr(request, "ai", "gemini")
        if ai == "groq":
            text = await generate_with_groq(
                request.message,
                system_instruction=system_instruction,
                history=history
            )
            return {"reply": text, "aiUsed": "groq"}
        else:
            # Use Gemini strictly
            text = await generate_with_gemini(
                request.message,
                system_instruction=system_instruction,
                history=history
            )
            return {"reply": text, "aiUsed": "gemini"}
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        error_msg = str(e).lower()
        if "503" in error_msg or "demand" in error_msg or "429" in error_msg or "quota" in error_msg:
            raise HTTPException(status_code=503, detail="AI_MODEL_BUSY")
        if "400" in error_msg or "api key" in error_msg:
            raise HTTPException(status_code=400, detail="API_KEY_INVALID")
        raise HTTPException(status_code=500, detail="Chat failed")

@router.post("/refetchYaml")
async def refetch_yaml(request: YamlRequest):
    try:
        prompt = f"Generate YAML based on: {request.overview}\n{request.analysis}"
        ai = getattr(request, "ai", "gemini")
        
        if ai == "groq":
            text = await generate_with_groq(prompt, is_json=True)
        else:
            text = await generate_with_gemini(prompt, is_json=True)
            
        res = json.loads(text)
        res["aiUsed"] = ai
        return res
    except Exception as e:
        logger.error(f"Error refetching yaml: {str(e)}")
        error_msg = str(e).lower()
        if "503" in error_msg or "demand" in error_msg or "429" in error_msg or "quota" in error_msg:
            raise HTTPException(status_code=503, detail="AI_MODEL_BUSY")
        if "400" in error_msg or "api key" in error_msg:
            raise HTTPException(status_code=400, detail="API_KEY_INVALID")
        raise HTTPException(status_code=500, detail="Refetch failed")