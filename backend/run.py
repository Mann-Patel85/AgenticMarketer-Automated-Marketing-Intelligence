"""
AgenticMarketer Backend — Production Runner Script (inside backend/).
Ensures correct sys.path resolution whether Render starts inside backend/ or from root.
"""

import os
import sys
from pathlib import Path

# Add parent directory (repo root) and backend directory to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent

for p in [str(REPO_ROOT), str(CURRENT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[AgenticMarketer] Starting server from backend/ on {host}:{port}")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
