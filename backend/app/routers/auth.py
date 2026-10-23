"""
AgenticMarketer Backend — Authentication Router.
Production Authentication, JWT Token Issuance, and Strict Role-Based Access Control (RBAC).
Persists users to PostgreSQL (Neon DB) via SQLAlchemy models.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db, User, UserSession
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Request / Response Schemas ───────────────────────────────────────

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=100)
    password: str


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


# ── Production Endpoints ─────────────────────────────────────────────

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user in the AgenticMarketer workspace.
    Public self-registration defaults strictly to the standard 'user' role.
    Only the configured ADMIN_EMAIL automatically receives 'admin' clearance.
    """
    email_key = payload.email.lower().strip()

    existing_user = db.query(User).filter(User.email == email_key).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in.",
        )

    # Strict RBAC: All public self-registrations receive standard 'user' role
    admin_email = os.getenv("ADMIN_EMAIL", "mann@company.com").lower().strip()
    assigned_role = "admin" if email_key == admin_email else "user"

    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        name=payload.name.strip(),
        email=email_key,
        password_hash=hash_password(payload.password),
        role=assigned_role,
        created_at=datetime.now(timezone.utc),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue signed JWT token
    token = create_access_token({
        "sub": email_key,
        "name": new_user.name,
        "role": assigned_role,
        "uid": user_id,
    })

    # Track active session
    session_record = UserSession(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=token[-16:],
        created_at=datetime.now(timezone.utc),
    )
    db.add(session_record)
    db.commit()

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(
            id=user_id,
            name=new_user.name,
            email=email_key,
            role=assigned_role,
        ),
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user credentials against PostgreSQL and return a signed JWT access token.
    Strictly denies invalid credentials with 401 Unauthorized.
    """
    email_key = payload.email.lower().strip()

    user = db.query(User).filter(User.email == email_key).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({
        "sub": email_key,
        "name": user.name,
        "role": user.role,
        "uid": user.id,
    })

    session_record = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=token[-16:],
        created_at=datetime.now(timezone.utc),
    )
    db.add(session_record)
    db.commit()

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(
            id=user.id,
            name=user.name,
            email=email_key,
            role=user.role,
        ),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve profile and permissions for the current authenticated user."""
    email = current_user.get("sub", "").lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return UserProfileResponse(
            id=current_user.get("uid", str(uuid.uuid4())),
            name=current_user.get("name", "User"),
            email=email,
            role=current_user.get("role", "user"),
        )

    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.get("/users", response_model=List[UserProfileResponse])
async def get_users(
    current_user: dict = Depends(require_roles(["admin", "owner"])),
    db: Session = Depends(get_db),
):
    """
    Retrieve list of workspace team members.
    Strict RBAC: Exclusively restricted to Super Admin (Mann Patel).
    Non-admin callers receive 403 Forbidden.
    """
    users = db.query(User).all()
    return [
        UserProfileResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
        )
        for u in users
    ]
