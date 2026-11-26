"""
AgenticMarketer Backend — FastAPI Main Application Entry Point.
Microservices Architecture:
- /api/auth   : JWT Authentication & Role-Based Access Control
- /api/rag    : Grounding Document Ingestion & Semantic Vector Store
- /api/swarm  : 5-Agent Collaborative Marketing Intelligence Swarm & SSE Streaming
- /api/publish: Omnichannel Social Publishing & Universal Webhooks
"""

import os
import sys
from pathlib import Path

# Ensure project root and backend folder are in sys.path so imports succeed on Linux/Render
_current_file = Path(__file__).resolve()
_backend_dir = _current_file.parents[1]
_repo_root = _current_file.parents[2]
for _p in [str(_repo_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

from backend.app.core.config import get_settings
from backend.app.database import init_db, SessionLocal, User, CampaignRun
from backend.app.core.security import get_current_user
from backend.app.routers.auth import router as auth_router
from backend.app.routers.admin import router as admin_router
from backend.app.routers.rag import router as rag_router
from backend.app.routers.swarm import router as swarm_router
from backend.app.routers.publish import router as publish_router
from backend.app.routers.workspace import router as workspace_router
from backend.app.routers.seo_auditor import router as seo_auditor_router
from backend.app.rag.vector_store import rag_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle hooks."""
    settings = get_settings()
    print(f"[AgenticMarketer] Backend starting up... App: {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"[AgenticMarketer] Storage Directories initialized at: {settings.DATA_DIRECTORY}")
    try:
        init_db()
        print("[AgenticMarketer] Database schema and seed verification complete.")
    except Exception as e:
        print(f"[AgenticMarketer DB Warning] Could not initialize database schema: {e}")
    yield
    print("[AgenticMarketer] Backend shutting down cleanly.")


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Autonomous Multi-Agent Marketing Intelligence & Omnichannel Publishing Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all global exception handler to prevent backend process crash.
    Full details go to the server log only; clients get a generic message so
    internal paths, SQL and secrets in exception text are never exposed."""
    import traceback
    print(f"[Backend Warning] Unhandled Exception at {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again.", "path": str(request.url.path)},
    )

# ── Dynamic CORS Policy for Production (Vercel & Render) ─────────────
allowed_origins = [
    os.getenv("FRONTEND_PROD_URL", "https://your-agenticmarketer.vercel.app"),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
frontend_prod = os.getenv("FRONTEND_PROD_URL")
if frontend_prod and frontend_prod not in allowed_origins:
    allowed_origins.append(frontend_prod)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ──────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(rag_router)
app.include_router(swarm_router)
app.include_router(publish_router)
app.include_router(workspace_router)
app.include_router(seo_auditor_router)


# ── Favicon & Root Endpoints ─────────────────────────────────────────
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Silence automatic browser favicon requests."""
    return Response(status_code=204)


@app.get("/api/swarm/images/{filename}", tags=["Swarm"])
async def serve_campaign_image(filename: str):
    """Serves AI-generated campaign images produced by FLUX / Photorealistic engine."""
    images_dir = (Path(settings.UPLOAD_DIRECTORY) / "images").resolve()
    safe_filename = Path(filename).name
    file_path = (images_dir / safe_filename).resolve()
    if not file_path.exists() or not file_path.is_file() or not file_path.is_relative_to(images_dir):
        raise HTTPException(status_code=404, detail=f"Image '{filename}' not found.")
    return FileResponse(str(file_path), media_type="image/png")

@app.get("/", tags=["System"])
async def root():
    """Welcome endpoint with system sitemap and status."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "rag": "/api/rag",
            "swarm": "/api/swarm",
            "publish": "/api/publish",
            "health": "/api/health",
            "telemetry": "/api/stats",
        },
    }


@app.api_route("/ping", methods=["GET", "HEAD"], tags=["System"])
@app.api_route("/api/ping", methods=["GET", "HEAD"], tags=["System"])
async def ping():
    """Ultra-light keep-alive probe (no DB / disk access).

    Hit by uptime monitors (UptimeRobot, cron-job.org, GitHub Actions) every
    ~10 min so Render's free tier doesn't spin the service down. HEAD is
    supported because UptimeRobot's free plan probes with HEAD.
    """
    return {"status": "ok"}


@app.get("/api/health", tags=["System"])
async def health_check():
    """Real-time microservice health check."""
    docs = rag_store.list_all_documents()
    images_dir = Path(settings.UPLOAD_DIRECTORY) / "images"
    images_count = len(list(images_dir.glob("*.png"))) if images_dir.exists() else 0
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "active_agents": 6,
        "agents": [
            "Document Ingestion Agent",
            "Market Research Agent",
            "Copywriter & Visual Agent",
            f"Image Generation Agent ({settings.effective_image_model})",
            "SEO & Analytics Agent",
            "Social Publisher Agent",
        ],
        "rag_status": "operational",
        "indexed_documents_count": len(docs),
        "groq_api_configured": bool(settings.effective_groq_token),
        "groq_model": settings.GROQ_MODEL,
        "groq_models_available": ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"],
        "gemini_api_configured": False,
        "gemini_model": "None (Migrated to Groq LPU)",
        "grok_api_configured": bool(settings.effective_grok_token),
        "grok_model": settings.GROK_MODEL,
        "image_model": settings.effective_image_model,
        "cloudflare_model": settings.CLOUDFLARE_IMAGE_MODEL,
        "cloudflare_configured": bool(settings.effective_cloudflare_token and settings.effective_cloudflare_account_id),
        "eden_ai_configured": bool(settings.effective_eden_ai_token),
        "image_generation_enabled": True,
        "generated_images_count": images_count,
    }


@app.get("/api/stats", tags=["System"])
async def system_telemetry(current_user: dict = Depends(get_current_user)):
    """Live telemetry for the Admin Console dashboard (requires login)."""
    from backend.app.routers.auth import MAX_OPERATOR_SEATS

    docs = rag_store.list_all_documents()
    total_chunks = sum(d.get("chunk_count", 0) for d in docs)
    with SessionLocal() as db:
        active_seats = db.query(User).count()
        campaign_runs = db.query(CampaignRun).count()
    return {
        # Token usage isn't metered yet; null tells the UI to show "not tracked"
        "groq_tokens_used": None,
        "groq_token_quota": None,
        "chroma_chunks_indexed": total_chunks,
        "indexed_documents": len(docs),
        "total_campaign_runs": campaign_runs,
        "active_seats": active_seats,
        "allocated_seats": MAX_OPERATOR_SEATS,
        "active_agents": 6,
        "system_status": "all_systems_operational",
    }
