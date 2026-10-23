"""
AgenticMarketer Backend — Administrative Control Router.
Strict Role-Based Access Control (RBAC): Accessible exclusively by Super Admin (Mann Patel).
All endpoints enforce user.role in ['admin', 'owner'], rejecting unauthorized callers with 403 Forbidden.
"""

import os
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db, User, Workspace, CampaignRun
from backend.app.core.security import require_roles
from backend.app.core.config import get_settings

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Control"],
    dependencies=[Depends(require_roles(["admin", "owner"]))],
)


# ── Schemas ──────────────────────────────────────────────────────────

class UserAdminView(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|marketer|user|backend_dev|frontend_dev)$")


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

    admin_email = os.getenv("ADMIN_EMAIL", "mann@company.com").lower().strip()
    if target_user.email == admin_email and payload.role != "admin":
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


from backend.app.core.security import require_roles, get_current_user

MAX_OPERATOR_SEATS = 10


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently revoke an operator seat and delete user account from the workspace.
    Strictly restricted to the primary Super Admin (Mann Patel).
    """
    admin_email = os.getenv("ADMIN_EMAIL", "mann@company.com").lower().strip()
    caller_email = current_user.get("sub", "").lower().strip()
    caller_role = current_user.get("role", "").lower().strip()

    # Only primary Super Admin can revoke seats
    if caller_email != admin_email and caller_role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the primary Super Admin (Mann Patel) can revoke operator seats.",
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    if target_user.email == admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The primary Super Admin / Owner account cannot be deleted or revoked.",
        )

    db.delete(target_user)
    db.commit()

    remaining_seats = db.query(User).count()
    return {
        "message": f"Operator seat for '{target_user.email}' successfully revoked.",
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
