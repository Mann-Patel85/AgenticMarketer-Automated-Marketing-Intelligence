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
    JWT_SECRET: str = "agentic-marketer-jwt-secret-key-production-change-2025"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── Google Gemini AI ─────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

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
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    TWITTER_API_KEY: str = ""
    TWITTER_API_SECRET: str = ""
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""

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
    # Ensure data and upload directories exist
    Path(settings.DATA_DIRECTORY).mkdir(parents=True, exist_ok=True)
    Path(settings.CHROMA_PERSIST_DIRECTORY).mkdir(parents=True, exist_ok=True)
    Path(settings.UPLOAD_DIRECTORY).mkdir(parents=True, exist_ok=True)
    return settings
