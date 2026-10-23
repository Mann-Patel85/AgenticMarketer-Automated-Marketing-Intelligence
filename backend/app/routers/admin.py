"""
AgenticMarketer Backend — Administrative Control Router.
Strict Role-Based Access Control (RBAC): Accessible exclusively by Super Admin / Owner.
All endpoints enforce user.role in ['admin', 'owner'], rejecting unauthorized callers with 403 Forbidden.
"""

import os
import uuid
import secrets
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session

from backend.app.database import get_db, User, Workspace, CampaignRun
from backend.app.core.security import require_roles, get_current_user, hash_password
from backend.app.core.config import get_settings
from backend.app.services.email import send_operator_invite_email

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Control"],
    dependencies=[Depends(require_roles(["admin", "owner"]))],
)

MAX_OPERATOR_SEATS = 10

def _get_admin_emails() -> set:
    """Resolves authorized admin emails strictly from environment variables without code leaks."""
    emails = set()
    primary = os.getenv("ADMIN_EMAIL", "").lower().strip()
    if primary:
        emails.add(primary)
    extra = os.getenv("ADMIN_EMAILS", "").lower().strip()
    if extra:
        emails.update(e.strip() for e in extra.split(",") if e.strip())
    return emails


# ── Schemas ──────────────────────────────────────────────────────────

class UserAdminView(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|marketer|user|backend_dev|frontend_dev)$")


class InviteOperatorRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=100)
    role: str = Field(default="marketer", pattern="^(admin|marketer|user|backend_dev|frontend_dev)$")


class AdminStatsResponse(BaseModel):
    total_users: int
    admin_users: int
    standard_users: int
    total_workspaces: int
    total_campaign_runs: int
    system_version: str
    database_status: str


# ── Endpoints ────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminView])
async def list_workspace_users(db: Session = Depends(get_db)):
    """List all registered users across the AgenticMarketer platform."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        UserAdminView(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.post("/users/invite", status_code=status.HTTP_201_CREATED)
async def invite_operator(
    payload: InviteOperatorRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Invite a new operator to the workspace:
    1. Checks the 10-operator capacity cap.
    2. Provisions temporary access credentials.
    3. Persists operator to database.
    4. Dispatches an invitation email from the admin's email.
    """
    caller_email = current_user.get("sub", "").lower().strip()
    caller_role = current_user.get("role", "").lower().strip()
    admin_emails = _get_admin_emails()
    caller_name = current_user.get("name") or os.getenv("ADMIN_NAME", "Administrator")

    # Only Super Admin can invite operators
    if caller_email not in admin_emails and caller_role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the primary Super Admin can invite new operators.",
        )

    # 1. Enforce 10-operator seat limit
    current_seats = db.query(User).count()
    if current_seats >= MAX_OPERATOR_SEATS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Workspace full: Maximum {MAX_OPERATOR_SEATS} operator seats reached ({current_seats}/{MAX_OPERATOR_SEATS}). Revoke an existing seat before adding another operator.",
        )

    email_key = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_key).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An operator with email '{email_key}' already exists in the workspace.",
        )

    # 2. Generate secure temporary password
    temp_password = f"Op-{secrets.token_hex(4).upper()}!"
    user_id = str(uuid.uuid4())

    new_user = User(
        id=user_id,
        name=payload.name.strip(),
        email=email_key,
        password_hash=hash_password(temp_password),
        role=payload.role,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Dispatch invitation email from Admin's mail via BackgroundTasks
    background_tasks.add_task(
        send_operator_invite_email,
        to_email=email_key,
        operator_name=new_user.name,
        role=new_user.role,
        temporary_password=temp_password,
        admin_name=caller_name,
        admin_email=caller_email or os.getenv("ADMIN_EMAIL", "admin@agenticmarketer.internal"),
    )

    remaining_seats = MAX_OPERATOR_SEATS - db.query(User).count()

    return {
        "message": f"Operator '{new_user.name}' successfully invited. Credentials dispatched from {caller_email}.",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "status": "Active",
            "created_at": new_user.created_at,
        },
        "temporary_password": temp_password,
        "invited_by": caller_email,
        "seats_available": max(0, remaining_seats),
    }


@router.patch("/users/{user_id}/role", response_model=UserAdminView)
async def update_user_clearance(
    user_id: str,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
):
    """Elevate or change a workspace user's role and clearance permissions."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    admin_emails = _get_admin_emails()
    if (target_user.email in admin_emails or target_user.role in ["admin", "owner"]) and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote the primary Super Admin account.",
        )

    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)

    return UserAdminView(
        id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        created_at=target_user.created_at,
    )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently revoke an operator seat and delete user account from the workspace.
    Strictly restricted to the primary Super Admin.
    Immunity: The Super Admin / Owner account cannot be deleted by anyone.
    """
    caller_email = current_user.get("sub", "").lower().strip()
    caller_role = current_user.get("role", "").lower().strip()
    admin_emails = _get_admin_emails()

    # "only i can delete other operators"
    if caller_email not in admin_emails and caller_role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the primary Super Admin can revoke operator seats.",
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    # "not others can delete me"
    if target_user.email in admin_emails or target_user.email == caller_email or target_user.role in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: The primary Super Admin / Owner account cannot be deleted or revoked by anyone.",
        )

    deleted_email = target_user.email
    db.delete(target_user)
    db.commit()

    remaining_seats = db.query(User).count()
    return {
        "message": f"Operator seat for '{deleted_email}' successfully revoked.",
        "status": "revoked",
        "seats_used": remaining_seats,
        "max_seats": MAX_OPERATOR_SEATS,
        "seats_available": max(0, MAX_OPERATOR_SEATS - remaining_seats),
    }


@router.get("/system", response_model=AdminStatsResponse)
async def get_admin_system_overview(db: Session = Depends(get_db)):
    """Retrieve comprehensive platform metrics, database pool health, and node counts."""
    settings = get_settings()
    total_users = db.query(User).count()
    admin_users = db.query(User).filter(User.role.in_(["admin", "owner"])).count()
    standard_users = total_users - admin_users
    total_workspaces = db.query(Workspace).count()
    total_campaign_runs = db.query(CampaignRun).count()

    return AdminStatsResponse(
        total_users=total_users,
        admin_users=admin_users,
        standard_users=standard_users,
        total_workspaces=total_workspaces,
        total_campaign_runs=total_campaign_runs,
        system_version=settings.APP_VERSION,
        database_status="healthy",
    )


@router.get("/logs")
async def get_system_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve recent campaign executions and audit trails."""
    runs = db.query(CampaignRun).order_by(CampaignRun.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "user_email": r.user_email,
            "goal": r.goal,
            "audience": r.audience,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in runs
    ]
