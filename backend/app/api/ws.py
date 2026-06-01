import logging
from typing import  Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.state import analysis_jobs, websocket_connections

logger = logging.getLogger(__name__)
router = APIRouter()


def get_websocket_connection(job_id: str) -> Set[WebSocket]:
    return websocket_connections.get(job_id, set())


def add_websocket_connection(job_id: str, websocket: WebSocket):
    if job_id not in websocket_connections:
        websocket_connections[job_id] = set()
    websocket_connections[job_id].add(websocket)


async def remove_websocket_connection(job_id: str, websocket: WebSocket):
    connections = websocket_connections.get(job_id, set())
    if websocket in connections:
        connections.discard(websocket)
        await websocket.close()


async def broadcast_to_job(job_id: str, message: dict):
    connections = websocket_connections.get(job_id, set())
    if not connections:
        return

    disconnected = []
    for connection in list(connections):
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            disconnected.append(connection)

    for conn in disconnected:
        await remove_websocket_connection(job_id, conn)


@router.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    logger.info(f"WebSocket connection established for job {job_id}")

    await websocket.accept()
    add_websocket_connection(job_id, websocket)

    try:
        await websocket.send_json({"type": "connected", "jobId": job_id})
    except Exception as e:
        logger.error(f"Failed to send connection confirmation: {e}")

    if job_id in analysis_jobs:
        try:
            await websocket.send_json({"type": "status", **analysis_jobs[job_id]})
        except Exception as e:
            logger.error(f"Failed to send initial status: {e}")

    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message from job {job_id}: {data}")
            await websocket.send_json({"type": "heartbeat", "jobId": job_id})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for job {job_id}")
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {e}")
    finally:
        await remove_websocket_connection(job_id, websocket)
