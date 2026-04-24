import os
import logging


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

env = os.getenv("PYTHON_ENV", "development")

if env == "production":
    logger.info("Running in Production Mode")
else:
    logger.info("Running in Development Mode")

DEBUG_MODE = env == "development"
RAW_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")




class Settings:
    PROJECT_NAME: str = "Auto-Ops Agent"
    DEBUG_MODE: bool = env == "development"
    ORIGINS: list = ["*"] if RAW_ORIGINS == "*" else [o.strip() for o in RAW_ORIGINS.split(",")]
    
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
    GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
    MODEL_ID: str = "gemini-2.5-flash"

settings = Settings()