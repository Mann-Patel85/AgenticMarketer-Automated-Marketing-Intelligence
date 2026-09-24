"""
AgenticMarketer Backend — User Workspace & Campaign State Persistence Router.
Ensures that all user campaign directives, generated copy, high-resolution visuals,
SEO metrics, omnichannel publishing configurations, and execution terminal logs
are automatically preserved and restored across user sessions.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Request, Query

from backend.app.core.config import get_settings

router = APIRouter(prefix="/api/workspace", tags=["Workspace"])

WORKSPACES_FILE = Path(get_settings().DATA_DIRECTORY) / "workspaces.json"


def _load_workspaces() -> Dict[str, Dict[str, Any]]:
    """Loads all user workspaces from JSON disk storage."""
    if not WORKSPACES_FILE.exists():
        WORKSPACES_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(WORKSPACES_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2)
        return {}

    try:
        with open(WORKSPACES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Workspace Storage Warning] Failed to read {WORKSPACES_FILE}: {e}")
        return {}


def _save_workspaces(data: Dict[str, Dict[str, Any]]) -> None:
    """Safely saves workspace dictionary to disk storage."""
    WORKSPACES_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = WORKSPACES_FILE.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    temp_file.replace(WORKSPACES_FILE)


def _resolve_user_email(request: Request, email_param: Optional[str] = None) -> str:
    """Resolves user email from Authorization JWT token or query/body parameter."""
    if email_param and "@" in email_param:
        return email_param.lower().strip()

    # Check Bearer token in header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        try:
            from backend.app.core.security import decode_access_token
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                return payload["sub"].lower().strip()
        except Exception:
            pass

    return "default_user@company.com"


class WorkspaceSaveRequest(BaseModel):
    email: Optional[str] = None
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
    autoPublish: Optional[bool] = False
    executionLogs: Optional[List[Any]] = []
    publishPlatforms: Optional[Dict[str, bool]] = None
    publishedChannels: Optional[List[str]] = []
    scheduleDate: Optional[str] = ""
    webhookUrl: Optional[str] = ""
    is_completed: Optional[bool] = False


@router.get("")
async def get_workspace(
    request: Request,
    email: Optional[str] = Query(None),
):
    """Retrieve saved workspace state and campaign history for the user."""
    user_email = _resolve_user_email(request, email)
    workspaces = _load_workspaces()
    user_record = workspaces.get(user_email, {})

    workspace_data = user_record.get("workspace", {})
    history_data = user_record.get("history", [])

    return {
        "status": "success",
        "email": user_email,
        "workspace": workspace_data,
        "history": history_data,
        "has_saved_data": bool(workspace_data),
    }


@router.post("")
async def save_workspace(
    payload: WorkspaceSaveRequest,
    request: Request,
):
    """Persist current user workspace state and update campaign history."""
    user_email = _resolve_user_email(request, payload.email)
    workspaces = _load_workspaces()

    if user_email not in workspaces:
        workspaces[user_email] = {
            "workspace": {},
            "history": [],
        }

    now_iso = datetime.now(timezone.utc).isoformat()

    workspace_dict = payload.model_dump(exclude={"email", "is_completed"}, exclude_none=False)
    workspace_dict["last_updated"] = now_iso

    workspaces[user_email]["workspace"] = workspace_dict

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
        history_list = workspaces[user_email].setdefault("history", [])
        # Prevent immediate duplicates
        if not history_list or history_list[0].get("title") != history_item["title"]:
            history_list.insert(0, history_item)
            # Retain top 30 campaigns
            workspaces[user_email]["history"] = history_list[:30]

    _save_workspaces(workspaces)

    return {
        "status": "success",
        "email": user_email,
        "saved_at": now_iso,
        "history_count": len(workspaces[user_email].get("history", [])),
    }


@router.post("/reset")
async def reset_workspace(
    request: Request,
    email: Optional[str] = Query(None),
):
    """Resets the current active campaign draft fields, preserving campaign history."""
    user_email = _resolve_user_email(request, email)
    workspaces = _load_workspaces()

    if user_email in workspaces:
        workspaces[user_email]["workspace"] = {}
        _save_workspaces(workspaces)

    return {
        "status": "success",
        "email": user_email,
        "message": "Active campaign draft reset. History preserved.",
    }


@router.get("/history")
async def get_workspace_history(
    request: Request,
    email: Optional[str] = Query(None),
):
    """Retrieve full campaign history archives for user."""
    user_email = _resolve_user_email(request, email)
    workspaces = _load_workspaces()
    history = workspaces.get(user_email, {}).get("history", [])
    return {
        "status": "success",
        "email": user_email,
        "history": history,
    }
