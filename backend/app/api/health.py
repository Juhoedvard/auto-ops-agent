import time
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint with wake-up support for Render services.
    
    This endpoint responds quickly to prevent timeouts when the service is sleeping.
    It can be called periodically to keep the service awake.
    """
    return {"status": "healthy"}


@router.get("/wake")
async def wake_up_service():
    """
    Endpoint to explicitly wake up a sleeping Render service.
    
    This can be called from frontend before making critical API calls.
    Takes ~3-5 seconds but ensures service is ready for subsequent requests.
    """
    import os
    
    # Check if we're in Render environment (it has special wake characteristics)
    is_render = os.getenv("ENVIRONMENT") == "render" or os.path.exists("/etc/render/")
    
    return {
        "status": "waking", 
        "is_render": is_render,
        "message": "Service is waking up and ready for requests"
    }


@router.get("/keepalive")
async def keep_alive():
    """
    Keep-alive endpoint to prevent Render service from going to sleep.
    
    Call this every 15 minutes or use your own scheduler.
    """
    return {"status": "alive", "timestamp": str(time.time())}
