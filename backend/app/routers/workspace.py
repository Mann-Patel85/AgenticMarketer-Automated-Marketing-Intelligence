"""
AgenticMarketer Backend — User Workspace & Campaign State Persistence Router.
Ensures that all user campaign directives, generated copy, high-resolution visuals,
SEO metrics, omnichannel publishing configurations, and execution terminal logs
are automatically preserved and restored in PostgreSQL (Neon DB).
"""

import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db, Workspace
from backend.app.core.security import get_current_user

router = APIRouter(prefix="/api/workspace", tags=["Workspace"])


def _user_email(current_user: dict = Depends(get_current_user)) -> str:
    """The workspace owner is ALWAYS the authenticated user. Client-supplied
    `email` params/fields are ignored, so nobody can read or overwrite
    another user's workspace."""
    return current_user["sub"].lower().strip()


class WorkspaceSaveRequest(BaseModel):
    email: Optional[str] = None  # ignored; kept for backwards-compatible clients
    campaignGoal: Optional[str] = ""
    targetAudience: Optional[str] = "B2B Tech Executives & Marketing Leaders"
    tone: Optional[str] = "Authoritative & High-Energy"
    generatedOutput: Optional[str] = ""
    generatedImageUrl: Optional[str] = None
    visualPrompt: Optional[str] = ""
    brandImagePrompt: Optional[str] = ""
    imageModelUsed: Optional[str] = ""
    clarityScore: Optional[float] = None
    imageAttemptsLog: Optional[List[Any]] = []
    seoData: Optional[Dict[str, Any]] = None
    seoBrief: Optional[Dict[str, Any]] = None
    factCheck: Optional[Dict[str, Any]] = None
    selectedBrandPlaybook: Optional[str] = None
    autoPublish: Optional[bool] = False
    executionLogs: Optional[List[Any]] = []
    publishPlatforms: Optional[Dict[str, bool]] = None
    publishedChannels: Optional[List[str]] = []
    scheduleDate: Optional[str] = ""
    webhookUrl: Optional[str] = ""
    is_completed: Optional[bool] = False


@router.get("")
async def get_workspace(
    user_email: str = Depends(_user_email),
    db: Session = Depends(get_db),
):
    """Retrieve saved workspace state and campaign history for the user from Neon DB."""
    record = db.query(Workspace).filter(Workspace.user_email == user_email).first()

    if not record:
        return {
            "status": "success",
            "email": user_email,
            "workspace": {},
            "history": [],
            "has_saved_data": False,
        }

    return {
        "status": "success",
        "email": user_email,
        "workspace": record.workspace_data or {},
        "history": record.history_data or [],
        "has_saved_data": bool(record.workspace_data),
    }


@router.post("")
async def save_workspace(
    payload: WorkspaceSaveRequest,
    user_email: str = Depends(_user_email),
    db: Session = Depends(get_db),
):
    """Persist current user workspace state and update campaign history in Neon DB."""
    record = db.query(Workspace).filter(Workspace.user_email == user_email).first()

    now_iso = datetime.now(timezone.utc).isoformat()
    workspace_dict = payload.model_dump(exclude={"email", "is_completed"}, exclude_none=False)
    workspace_dict["last_updated"] = now_iso

    if not record:
        record = Workspace(
            id=str(uuid.uuid4()),
            user_email=user_email,
            workspace_data=workspace_dict,
            history_data=[],
            updated_at=datetime.now(timezone.utc),
        )
        db.add(record)
    else:
        record.workspace_data = workspace_dict
        record.updated_at = datetime.now(timezone.utc)

    # If this campaign was finished or generated output exists, record a history snapshot
    if payload.is_completed and (payload.generatedOutput or payload.generatedImageUrl):
        history_item = {
            "id": f"camp_{int(time.time())}",
            "title": (payload.campaignGoal or "Autonomous Campaign")[:90],
            "audience": payload.targetAudience or "General B2B",
            "tone": payload.tone,
            "image_url": payload.generatedImageUrl,
            "seo_score": payload.seoData.get("seo_score") if payload.seoData else None,
            "completed_at": now_iso,
            "preview_snippet": (payload.generatedOutput or "")[:180],
        }
        current_history = list(record.history_data or [])
        if not current_history or current_history[0].get("title") != history_item["title"]:
            current_history.insert(0, history_item)
            record.history_data = current_history[:30]

    db.commit()

    return {
        "status": "success",
        "email": user_email,
        "saved_at": now_iso,
        "history_count": len(record.history_data or []),
    }


@router.post("/reset")
async def reset_workspace(
    user_email: str = Depends(_user_email),
    db: Session = Depends(get_db),
):
    """Resets the active campaign draft fields, preserving campaign history in Neon DB."""
    record = db.query(Workspace).filter(Workspace.user_email == user_email).first()

    if record:
        record.workspace_data = {}
        record.updated_at = datetime.now(timezone.utc)
        db.commit()

    return {
        "status": "success",
        "email": user_email,
        "message": "Active campaign draft reset. History preserved.",
    }


@router.get("/history")
async def get_workspace_history(
    user_email: str = Depends(_user_email),
    db: Session = Depends(get_db),
):
    """Retrieve full campaign history archives for user from Neon DB."""
    record = db.query(Workspace).filter(Workspace.user_email == user_email).first()
    history = record.history_data if record else []
    return {
        "status": "success",
        "email": user_email,
        "history": history or [],
    }
