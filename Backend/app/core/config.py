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

    # ── Google Gemini AI ─────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    GEMINI_IMAGE_MODEL: str = "gemini-3-pro-image"

    @property
    def effective_text_model(self) -> str:
        """Returns valid text model identifier for Google GenAI SDK."""
        if not self.GEMINI_MODEL or "image" in self.GEMINI_MODEL.lower():
            return "gemini-3.6-flash"
        return self.GEMINI_MODEL

    @property
    def effective_image_model(self) -> str:
        """Returns the model for image generation."""
        return self.GEMINI_IMAGE_MODEL or "gemini-3-pro-image"

    # ── Hugging Face AI (Secondary / Fallback Image Generation) ───────
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_IMAGE_MODEL: str = "black-forest-labs/FLUX.1-schnell"

    @property
    def effective_hf_token(self) -> str:
        """Returns Hugging Face API token from HUGGINGFACE_API_KEY or HF_TOKEN env var."""
        import os
        return self.HUGGINGFACE_API_KEY or os.getenv("HF_TOKEN") or ""

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
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".md"]

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
