
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.api.ws import router as websocket_router
from app.core.config import settings
from app.api.health import router as health_router


logger = logging.getLogger(__name__)

app = FastAPI(
    title="Auto-Ops Agent API",
    debug=settings.DEBUG_MODE
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(websocket_router)
app.include_router(health_router)

@app.on_event("startup")
async def startup_event():
    logger.info("Successfully started Auto-Ops Backend!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)