"""
AgenticMarketer Backend — Production Database Module (Neon PostgreSQL + SQLAlchemy).
Connects to Neon DB in production via DATABASE_URL with SSL support,
with automatic schema initialization and local SQLite fallback for offline development.
"""

import os
import sys
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator, Optional, Dict, Any, List

# Ensure project root is in sys.path
_current_file = Path(__file__).resolve()
_backend_dir = _current_file.parents[1]
_repo_root = _current_file.parents[2]
for _p in [str(_repo_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Boolean,
    Float,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.security import hash_password

Base = declarative_base()


# ── ORM Models ───────────────────────────────────────────────────────

class User(Base):
    """User account entity for RBAC authentication."""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="marketer", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserSession(Base):
    """Active user session tracking for security auditing."""
    __tablename__ = "sessions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String(256), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=True)


class Workspace(Base):
    """User workspace state and campaign drafts."""
    __tablename__ = "workspaces"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_email = Column(String(256), unique=True, index=True, nullable=False)
    workspace_data = Column(JSON, default=dict, nullable=False)
    history_data = Column(JSON, default=list, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class CampaignRun(Base):
    """Archived autonomous swarm executions and telemetry."""
    __tablename__ = "campaign_runs"

    id = Column(String(64), primary_key=True)  # run_id
    user_email = Column(String(256), index=True, nullable=True)
    goal = Column(Text, nullable=True)
    audience = Column(String(256), nullable=True)
    tone = Column(String(128), nullable=True)
    status = Column(String(64), default="completed")
    payload = Column(JSON, default=dict)
    result = Column(JSON, default=dict)
    logs = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Database Connection & Engine Configuration ───────────────────────

def get_database_url() -> str:
    """
    Resolves DATABASE_URL from environment with SSL enforcement for Neon DB,
    falling back to local SQLite if DATABASE_URL is not configured.
    """
    raw_url = os.getenv("DATABASE_URL", "").strip()

    if not raw_url:
        data_dir = Path(__file__).resolve().parents[2] / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        sqlite_path = (data_dir / "agenticmarketer.db").resolve()
        return f"sqlite:///{sqlite_path}"

    # Detect installed PostgreSQL drivers
    try:
        import psycopg  # noqa: F401
        has_psycopg3 = True
    except ImportError:
        has_psycopg3 = False

    try:
        import psycopg2  # noqa: F401
        has_psycopg2 = True
    except ImportError:
        has_psycopg2 = False

    # Handle Postgres URL prefix variants (Render / Neon uses postgres://)
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    # If psycopg (v3) is requested but not installed, fallback to psycopg2 if available
    if "postgresql+psycopg://" in raw_url and not has_psycopg3 and has_psycopg2:
        raw_url = raw_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    # If standard postgresql:// is provided and only psycopg v3 is installed, route to psycopg3
    elif raw_url.startswith("postgresql://") and not has_psycopg2 and has_psycopg3:
        raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)

    # Automatically enforce SSL mode for Neon DB / Cloud Postgres
    if "neon.tech" in raw_url and "sslmode" not in raw_url:
        sep = "&" if "?" in raw_url else "?"
        raw_url = f"{raw_url}{sep}sslmode=require"

    return raw_url


DATABASE_URL = get_database_url()
is_sqlite = DATABASE_URL.startswith("sqlite")

# Engine options for production connection pooling
engine_args = {}
if is_sqlite:
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20
    engine_args["pool_pre_ping"] = True
    engine_args["pool_recycle"] = 300

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Initialization & Seed Data Migration ─────────────────────────────

def init_db():
    """
    Initializes database tables and migrates demo/seed accounts
    as well as existing JSON data if present.
    """
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        # Check if users already exist
        existing_count = db.query(User).count()
        if existing_count == 0:
            print("[Database] Seeding initial workspace accounts into database...")
            default_users = [
                User(
                    id=str(uuid.uuid4()),
                    name="Mann Patel",
                    email="mann@company.com",
                    password_hash=hash_password("admin123"),
                    role="leader",
                ),
                User(
                    id=str(uuid.uuid4()),
                    name="System Admin",
                    email="admin@company.com",
                    password_hash=hash_password("admin123"),
                    role="admin",
                ),
                User(
                    id=str(uuid.uuid4()),
                    name="Sarah Jenkins",
                    email="sarah@company.com",
                    password_hash=hash_password("market123"),
                    role="marketer",
                ),
                User(
                    id=str(uuid.uuid4()),
                    name="Growth Marketer",
                    email="marketer@company.com",
                    password_hash=hash_password("market123"),
                    role="marketer",
                ),
            ]
            db.add_all(default_users)
            db.commit()

        # Migrate local workspaces.json if found and table is empty
        workspace_count = db.query(Workspace).count()
        if workspace_count == 0:
            data_file = Path(__file__).resolve().parents[2] / "data" / "workspaces.json"
            if data_file.exists():
                try:
                    with open(data_file, "r", encoding="utf-8") as f:
                        saved_workspaces = json.load(f)
                    for email, record in saved_workspaces.items():
                        db.add(
                            Workspace(
                                user_email=email.lower().strip(),
                                workspace_data=record.get("workspace", {}),
                                history_data=record.get("history", []),
                            )
                        )
                    db.commit()
                    print(f"[Database] Migrated {len(saved_workspaces)} workspace records from workspaces.json")
                except Exception as e:
                    print(f"[Database Warning] Could not migrate workspaces.json: {e}")
