import os
import uuid
import asyncio
from dotenv import load_dotenv
from google import genai
from fastapi import FastAPI, HTTPException, BackgroundTasks 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import shutil
import tempfile
from pathlib import Path


load_dotenv()

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


analysis_jobs = {}


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class ChatMessage(BaseModel):
    message: str

class RepoRequest(BaseModel):
    url: str


async def analyze_repository(repo_url: str, job_id: str):
    temp_dir = tempfile.mkdtemp()
    
    try: 
        analysis_jobs[job_id]["status"] = "cloning"
        print(f"Cloning {repo_url} to {temp_dir}...")
        
        result = subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, temp_dir],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise Exception(f"Git clone failed: {result.stderr}")

        analysis_jobs[job_id]["status"] = "analyzing"

        files = []
        for path in Path(temp_dir).rglob('*'):
            if path.is_file() and ".git" not in str(path):
                files.append(str(path.relative_to(temp_dir)))
        
        file_list_str = "\n".join(files[:50]) 
        await asyncio.sleep(1) #


        analysis_jobs[job_id]["status"] = "generating"
        
        prompt = f"""
        Analyze this GitHub repository: {repo_url}
        Here are the project files:
        {file_list_str}
        
        Create a professional CI/CD recommendation report in Markdown format.
        Suggest a GitHub Actions .yml file based on the file structure.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        

        analysis_jobs[job_id]["status"] = "ready"
        analysis_jobs[job_id]["result"] = response.text
        
    except Exception as e:
        print(f"Error in job {job_id}: {e}")
        analysis_jobs[job_id]["status"] = "failed"
        analysis_jobs[job_id]["error"] = str(e)
    
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

@app.get("/")
def read_root():
    return {"status": "Agent is running"}


@app.post("/analyze")
async def start_analysis(request: RepoRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    analysis_jobs[job_id] = {
        "status": "pending",
        "result": None,
        "error": None
    }

    background_tasks.add_task(analyze_repository, request.url.strip(), job_id)
    return {"jobId": job_id}


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job_id,
        "status": analysis_jobs[job_id]["status"],
        "result": analysis_jobs[job_id]["result"],
        "error": analysis_jobs[job_id]["error"]
    }


@app.post("/chat")
async def chat_with_gemini(chat_message: ChatMessage):
    if not chat_message.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=chat_message.message
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)