"""
AgenticMarketer Backend — Production Runner Script.
Ensures correct sys.path resolution for both Render and local deployments.
"""

import os
import sys
from pathlib import Path

# Ensure project root is at the head of sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

BACKEND_DIR = ROOT_DIR / "backend"
if BACKEND_DIR.exists() and str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[AgenticMarketer] Starting server on {host}:{port}")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
