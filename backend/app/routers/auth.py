"""
AgenticMarketer Backend — Authentication Router.
Handles registration, login, and current user profile retrieval with JWT and RBAC.
Persists users to PostgreSQL (Neon DB) / SQLAlchemy tables.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db, User, UserSession
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Pydantic Request / Response Schemas ──────────────────────────────
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)
    role: Optional[str] = Field("marketer")


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


# ── Routes ──────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user in the AgenticMarketer workspace."""
    email_key = payload.email.lower().strip()

    existing_user = db.query(User).filter(User.email == email_key).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user_id = str(uuid.uuid4())
    allowed_roles = ["leader", "admin", "marketer", "backend_dev", "frontend_dev", "user"]
    assigned_role = payload.role.lower() if payload.role and payload.role.lower() in allowed_roles else "marketer"

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

    # Issue JWT token
    token = create_access_token({
        "sub": email_key,
        "name": new_user.name,
        "role": assigned_role,
        "uid": user_id,
    })

    # Record active session in database
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
    """Authenticate credentials and return a signed JWT access token."""
    email_key = payload.email.lower().strip()

    user = db.query(User).filter(User.email == email_key).first()
    # Support alias for Sarah (sarah@company.com <-> marketer@company.com)
    if not user and email_key == "sarah@company.com":
        user = db.query(User).filter(User.email == "marketer@company.com").first()
    elif not user and email_key == "marketer@company.com":
        user = db.query(User).filter(User.email == "sarah@company.com").first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({
        "sub": email_key,
        "name": user.name,
        "role": user.role,
        "uid": user.id,
    })

    # Track session
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
    """Retrieve profile and permissions for current authenticated user."""
    email = current_user.get("sub", "").lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return UserProfileResponse(
            id=current_user.get("uid", str(uuid.uuid4())),
            name=current_user.get("name", "User"),
            email=email,
            role=current_user.get("role", "marketer"),
        )

    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.get("/users", response_model=List[UserProfileResponse])
async def get_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve list of workspace team members (for workspace management)."""
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
