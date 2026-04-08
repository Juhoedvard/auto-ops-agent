import os
import uuid
import asyncio
import shutil
import tempfile
import json
from pathlib import Path
from google import genai
from fastapi import FastAPI, HTTPException, BackgroundTasks 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any

env = os.getenv("PYTHON_ENV", "development")

if env == "production":
    
    print("Running in Production Mode")
else:
    print("Running in Development Mode")
DEBUG_MODE = os.getenv("PYTHON_ENV", "development") == "development"
app = FastAPI(debug=DEBUG_MODE)
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")




if raw_origins == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analysis_jobs = {}


GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
client = genai.Client(api_key=GOOGLE_API_KEY)
MODEL_ID = "gemini-2.5-flash"



class ChatPart(BaseModel):
    text: str

class ChatMessage(BaseModel):
    role: str
    parts: List[ChatPart]

class ChatRequest(BaseModel):
    message: str
    context: str
    history: List[ChatMessage]

class RepoRequest(BaseModel):
    url: str

class YamlRequest(BaseModel):
    overview: str
    analysis: str

def sanitize_analysis_result(raw_data: Any) -> dict:
    """
    Ensures that the AI response matches the expected structure and types.
    This prevents frontend crashes by cleaning up inconsistencies.
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


async def analyze_repository(repo_url: str, job_id: str):
    temp_dir = tempfile.mkdtemp()
    
    try: 
        analysis_jobs[job_id]["status"] = "cloning"
        
       
        try:
            process = await asyncio.create_subprocess_exec(
                "git", "clone", "--depth", "1", repo_url.strip(), temp_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60.0)
            
            if process.returncode != 0:
                stderr_text = stderr.decode('utf-8', errors='ignore') if stderr else ""
                raise Exception(f"Git clone failed: {stderr_text}")
        except asyncio.TimeoutError:
            raise Exception("Repository clone timed out. The repository may be too large or the connection is slow.")
        
        analysis_jobs[job_id]["status"] = "analyzing"
        

        content_summary = ""
        target_files = ["package.json", "requirements.txt", "Dockerfile", "README.md", "go.mod"]
        for file_name in target_files:
            file_path = Path(temp_dir) / file_name
            if file_path.exists():
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content_summary += f"\n--- FILE: {file_name} ---\n{f.read(2000)}\n"
                except: continue

        analysis_jobs[job_id]["status"] = "generating"
        
        prompt = (
            f"Act as a Senior DevOps Engineer. Your task is to analyze the provided repository: {repo_url}\n"
            f"Use the following file context to determine the build, test, and deployment requirements:\n"
            f"{content_summary}\n\n"
            "Generate a production-grade CI/CD strategy. Return a JSON object with these exact fields:\n"
            "1. 'overview': A concise summary (2-3 sentences) of what the project does.\n"
            "2. 'tech_stack': A list of all identified programming languages, frameworks, and infrastructure tools.\n"
            "3. 'analysis': A detailed technical breakdown in Markdown. Explain the CI/CD requirements, dependency management, and recommended environment variables.\n"
            "4. 'yaml_config': A complete, syntax-valid GitHub Actions .yml file. It MUST include: \n"
            "   - Triggers for push/PR to main/master.\n"
            "   - Job for linting/security scanning.\n"
            "   - Job for running unit tests.\n"
            "   - A placeholder job for deployment (e.g., to Docker Hub, AWS, or Vercel).\n"
            "5. 'implementation_steps': A step-by-step list of what the user needs to do (e.g., 'Add secret X to GitHub Settings').\n"
            "6. 'benefits': A list of how this specific pipeline improves the development lifecycle.\n\n"
            "Language: English. Ensure the JSON is valid and the YAML is properly escaped."
        )
        
      
        try:
            response = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: client.models.generate_content(
                        model=MODEL_ID,
                        contents=prompt,
                        config={"response_mime_type": "application/json"}
                    )
                ),
                timeout=120.0
            )
        except asyncio.TimeoutError:
            raise Exception("AI analysis timed out. The repository may be too complex to analyze.")
        
        raw_json = json.loads(response.text)


        analysis_jobs[job_id]["result"] = sanitize_analysis_result(raw_json)
        analysis_jobs[job_id]["status"] = "ready"
        
    except Exception as e:
        analysis_jobs[job_id]["status"] = "failed"
        analysis_jobs[job_id]["error"] = str(e)
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)



@app.get("/")
def read_root():
    return {"status": "Auto-Ops Agent API is active"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return analysis_jobs[job_id]

@app.post("/analyze")
async def start_analysis(request: RepoRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    analysis_jobs[job_id] = {"status": "pending", "result": None, "error": None}
    background_tasks.add_task(analyze_repository, request.url.strip(), job_id)
    return {"jobId": job_id}

@app.post("/refetchYaml")
async def refetch_yaml(request: YamlRequest):
    try:
        prompt = f"""
        Based on the following project overview and technical analysis, 
        generate a complete and valid CI/CD YAML configuration file (e.g., GitHub Actions).

        Project Overview:
        {request.overview}

        Technical Analysis:
        {request.analysis}

        Return a JSON object with a single field 'yaml' containing the string content of the configuration.
        """
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_gemini(request: ChatRequest):
    try:
        history = []
        for msg in request.history:
            if msg.parts and msg.parts[0].text:
                history.append({
                    "role": "user" if msg.role == "user" else "model",
                    "parts": [{"text": msg.parts[0].text}]
                })
        system_instruction = (
            "You are Auto-Ops AI, a friendly and professional Senior DevOps Assistant. "
            "You have access to the current project YAML configuration for context.\n\n"
            f"CURRENT PROJECT YAML:\n{request.context}\n\n"
            "GUIDELINES FOR YOUR RESPONSES:\n"
            "1. GREETINGS: If the user says 'Hello' or similar, respond warmly and briefly. Don't show technical details unless asked.\n"
            "2. TECHNICAL QUESTIONS: Answer clearly and concisely.\n"
            "3. REQUESTING CHANGES: If the user wants to change the YAML (e.g., 'add a test step' or 'change branch'):\n"
            "   - First, briefly explain what you are changing.\n"
            "   - Then, provide the FULL updated YAML configuration inside a ```yaml code block.\n"
            "   - Always ensure the new YAML is valid and ready to be used.\n"
            "4. CONTEXT: Always base your suggestions on the provided CURRENT PROJECT YAML. "
            "If the user's request is impossible or needs more info, ask clarifying questions."
        )
        full_contents = history + [
            {"role": "user", "parts": [{"text": f"{system_instruction}\n\nUser: {request.message}"}]}
        ]

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=full_contents
        )
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)