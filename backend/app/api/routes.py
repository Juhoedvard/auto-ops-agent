import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import RepoRequest, ChatRequest, YamlRequest
from app.services.repo_service import analyze_repository
from app.services.ai_service import generate_with_fallback, sanitize_analysis_result
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

    background_tasks.add_task(analyze_repository, request.url.strip(), job_id, analysis_jobs)
    
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
        
        text, fallback_used = await generate_with_fallback(
            request.message, 
            system_instruction=system_instruction, 
            history=history
        )
        
        return {"reply": text, "fallbackUsed": fallback_used}
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Chat failed")

@router.post("/refetchYaml")
async def refetch_yaml(request: YamlRequest):

    prompt = f"Generate YAML based on: {request.overview}\n{request.analysis}"
    text, fallback_used = await generate_with_fallback(prompt, is_json=True)
    res = json.loads(text)
    res["fallbackUsed"] = fallback_used
    return res