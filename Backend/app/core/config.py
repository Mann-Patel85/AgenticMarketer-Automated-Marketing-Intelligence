"""
AgenticMarketer Backend — Centralized Configuration via Pydantic Settings.
Loads environment variables from .env file at project root or backend directory.
"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App Info ─────────────────────────────────────────────────────
    APP_NAME: str = "AgenticMarketer Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Security & Authentication ────────────────────────────────────
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── Database (Neon PostgreSQL) ───────────────────────────────────
    DATABASE_URL: str = ""

    # ── Production Frontend URL ──────────────────────────────────────
    FRONTEND_PROD_URL: str = ""

    # ── Groq Cloud LPU AI (Primary High-Speed LLM Engine) ────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_FAST_MODEL: str = "openai/gpt-oss-20b"

    @property
    def effective_groq_token(self) -> str:
        """Returns Groq API token from GROQ_API_KEY or Groq_API_KEY env var."""
        import os
        return self.GROQ_API_KEY or os.getenv("GROQ_API_KEY") or os.getenv("Groq_API_KEY") or ""

    @property
    def effective_text_model(self) -> str:
        """Returns active text model identifier (Groq LPU)."""
        return self.GROQ_MODEL or "openai/gpt-oss-120b"

    @property
    def effective_image_model(self) -> str:
        """Returns the model for image generation."""
        return self.CLOUDFLARE_IMAGE_MODEL or "@cf/black-forest-labs/flux-1-schnell"

    # ── Cloudflare Workers AI (Primary Image Generation) ────────────
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_IMAGE_MODEL: str = "@cf/black-forest-labs/flux-1-schnell"
    CLOUDFLARE_VISION_MODEL: str = "@cf/meta/llama-3.2-11b-vision-instruct"

    @property
    def effective_cloudflare_token(self) -> str:
        """Returns Cloudflare API token from CLOUDFLARE_API_TOKEN env var."""
        import os
        token = self.CLOUDFLARE_API_TOKEN or os.getenv("CLOUDFLARE_API_TOKEN") or ""
        return token.strip("\"'")

    @property
    def effective_cloudflare_account_id(self) -> str:
        """Returns Cloudflare Account ID from CLOUDFLARE_ACCOUNT_ID env var."""
        import os
        acc_id = self.CLOUDFLARE_ACCOUNT_ID or os.getenv("CLOUDFLARE_ACCOUNT_ID") or ""
        return acc_id.strip("\"'")

    # ── Eden AI (Fallback 1 Image Generation) ───────────────────────
    EDEN_AI_API_KEY: str = ""

    @property
    def effective_eden_ai_token(self) -> str:
        """Returns Eden AI API token from EDEN_AI_API_KEY env var."""
        import os
        return self.EDEN_AI_API_KEY or os.getenv("EDEN_AI_API_KEY") or ""

    # ── Grok AI (xAI API Fallback) ───────────────────────────────────
    GROK_API_KEY: str = ""
    XAI_API_KEY: str = ""
    GROK_MODEL: str = "grok-2-latest"

    @property
    def effective_grok_token(self) -> str:
        """Returns Grok/xAI API token from GROK_API_KEY or XAI_API_KEY env var."""
        import os
        return self.GROK_API_KEY or self.XAI_API_KEY or os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY") or ""

    # ── Storage & RAG Directories ────────────────────────────────────
    DATA_DIRECTORY: str = str(Path(__file__).resolve().parents[2] / "data")
    CHROMA_PERSIST_DIRECTORY: str = str(Path(__file__).resolve().parents[2] / "data" / "chroma")
    UPLOAD_DIRECTORY: str = str(Path(__file__).resolve().parents[2] / "data" / "uploads")

    # ── CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    # ── Social Publishing Integrations ───────────────────────────────
    # LinkedIn
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_ACCESS_TOKEN: str = ""
    LINKEDIN_PERSON_URN: str = ""

    # Twitter / X
    TWITTER_API_KEY: str = ""
    TWITTER_API_SECRET: str = ""
    TWITTER_ACCESS_TOKEN: str = ""
    TWITTER_ACCESS_TOKEN_SECRET: str = ""
    TWITTER_BEARER_TOKEN: str = ""

    # Meta (Facebook Page & Instagram)
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_PAGE_ID: str = ""
    META_PAGE_ACCESS_TOKEN: str = ""
    INSTAGRAM_ACCOUNT_ID: str = ""

    # Reddit
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_USERNAME: str = ""
    REDDIT_PASSWORD: str = ""
    REDDIT_SUBREDDIT: str = "test"

    # Meta Threads
    THREADS_USER_ID: str = ""
    THREADS_ACCESS_TOKEN: str = ""

    # Buffer Aggregator
    BUFFER_ACCESS_TOKEN: str = ""
    BUFFER_WEBHOOK_URL: str = ""

    # ── File Ingestion Constraints ───────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]

    model_config = {
        "env_file": (
            str(Path(__file__).resolve().parents[2] / ".env"),
            str(Path(__file__).resolve().parents[3] / ".env")
        ),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton settings instance."""
    settings = Settings()
    # If no JWT_SECRET is configured in .env or environment, generate an in-memory random secret for this session
    if not settings.JWT_SECRET:
        import secrets
        settings.JWT_SECRET = secrets.token_hex(32)
    # Ensure data and upload directories exist
    Path(settings.DATA_DIRECTORY).mkdir(parents=True, exist_ok=True)
    Path(settings.CHROMA_PERSIST_DIRECTORY).mkdir(parents=True, exist_ok=True)
    Path(settings.UPLOAD_DIRECTORY).mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
