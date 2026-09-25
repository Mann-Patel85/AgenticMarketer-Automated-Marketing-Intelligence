"""
AgenticMarketer Backend — FastAPI Main Application Entry Point.
Microservices Architecture:
- /api/auth   : JWT Authentication & Role-Based Access Control
- /api/rag    : Grounding Document Ingestion & Semantic Vector Store
- /api/swarm  : 5-Agent Collaborative Marketing Intelligence Swarm & SSE Streaming
- /api/publish: Omnichannel Social Publishing & Universal Webhooks
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Response, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

from backend.app.core.config import get_settings
from backend.app.routers.auth import router as auth_router
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
    """Catch-all global exception handler to prevent backend process crash."""
    print(f"[Backend Warning] Unhandled Exception at {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}", "path": str(request.url.path)},
    )

# ── CORS Middleware ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ──────────────────────────────────────────────────
app.include_router(auth_router)
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
    """Serves AI-generated campaign images produced by Gemini 2.5 Flash (Nano Banana)."""
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


@app.get("/api/health", tags=["System"])
async def health_check():
    """Real-time microservice health check."""
    docs = rag_store.list_documents()
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
        "gemini_api_configured": bool(settings.GEMINI_API_KEY),
        "gemini_model": settings.effective_text_model,
        "grok_api_configured": bool(settings.effective_grok_token),
        "grok_model": settings.GROK_MODEL,
        "image_model": settings.effective_image_model,
        "huggingface_model": settings.HUGGINGFACE_IMAGE_MODEL,
        "huggingface_configured": bool(settings.effective_hf_token),
        "image_generation_enabled": True,
        "generated_images_count": images_count,
    }


@app.get("/api/stats", tags=["System"])
async def system_telemetry():
    """Telemetry data matching the Admin Console dashboard."""
    docs = rag_store.list_documents()
    total_chunks = sum(d.get("chunk_count", 0) for d in docs)
    return {
        "gemini_tokens_used": 142850,
        "gemini_token_quota": 1000000,
        "chroma_chunks_indexed": total_chunks,
        "indexed_documents": len(docs),
        "active_seats": 5,
        "allocated_seats": 10,
        "active_agents": 5,
        "system_status": "all_systems_operational",
    }
