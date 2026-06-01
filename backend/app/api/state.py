from typing import Dict, Set
from fastapi import WebSocket

analysis_jobs: Dict[str, dict] = {}
websocket_connections: Dict[str, Set[WebSocket]] = {}
