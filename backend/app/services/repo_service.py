




import asyncio
import json
import logging
import os
import shutil
import tempfile

from pathlib import Path

from app.services.ai_service import generate_with_fallback, sanitize_analysis_result

logger = logging.getLogger(__name__)


async def clone_repository(repo_url: str, temp_dir: str):
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


async def get_repo_content(temp_dir: str):

    content_summary = ""
    target_files = ["package.json", "requirements.txt", "Dockerfile", "README.md", "go.mod"]

    base_path = Path(temp_dir)
    for file_name in target_files:
        file_path = base_path / file_name
        if file_path.is_file():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content_summary += f"\n--- FILE: {file_name} ---\n{f.read(2000)}\n"
            except: continue

    return content_summary


async def analyze_repository(repo_url: str, job_id: str, analysis_jobs: dict):
    """
    The core background task for repository analysis.
    
    Workflow:
    1. Creates a temporary directory and clones the repository (shallow clone).
    2. Scans for configuration files (package.json, requirements.txt, etc.).
    3. Sends file context to Gemini to generate a CI/CD strategy.
    4. Handles 503 'Model Busy' errors by setting a specific error state.
    5. Cleans up temporary files regardless of success or failure.
    """
    temp_dir = tempfile.mkdtemp()

    logger.info(f"Starting analysis for job {job_id}: {repo_url}")
    try: 
        analysis_jobs[job_id]["status"] = "cloning"
    
        await clone_repository(repo_url, temp_dir)
        
        analysis_jobs[job_id]["status"] = "analyzing"
        
        content_summary = await get_repo_content(temp_dir)

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
        
      
        text, fallback_used = await generate_with_fallback(prompt, is_json=True)
        
        raw_json = json.loads(text)

        analysis_jobs[job_id]["result"] = sanitize_analysis_result(raw_json)
        analysis_jobs[job_id]["status"] = "ready"
        analysis_jobs[job_id]["fallbackUsed"] = fallback_used
        logger.info(f"Analysis complete for job {job_id}")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Job {job_id} failed: {error_msg}")
        analysis_jobs[job_id]["status"] = "failed"
        if "503" in error_msg or "demand" in error_msg.lower():
            analysis_jobs[job_id]["error"] = "AI_MODEL_BUSY"
        elif "429" in error_msg or "quota" in error_msg.lower():
            analysis_jobs[job_id]["error"] = "QUOTA_EXCEEDED"
        else:
            analysis_jobs[job_id]["error"] = error_msg
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


