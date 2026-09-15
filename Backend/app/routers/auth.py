"""
AgenticMarketer Backend — Authentication Router.
Handles registration, login, and current user profile retrieval with JWT and RBAC.
Persists users to JSON file storage in backend/data/users.json.
"""

import json
import uuid
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Depends, status

from backend.app.core.config import get_settings
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# File path for persistent user storage
USERS_FILE = Path(get_settings().DATA_DIRECTORY) / "users.json"


def _load_users() -> Dict[str, Dict[str, Any]]:
    """Load users from JSON storage or initialize with default demo accounts."""
    if not USERS_FILE.exists():
        initial_users = {
            "mann@company.com": {
                "id": str(uuid.uuid4()),
                "name": "Mann Patel",
                "email": "mann@company.com",
                "password_hash": hash_password("admin123"),
                "role": "leader",
                "created_at": "2025-01-01T00:00:00Z",
            },
            "admin@company.com": {
                "id": str(uuid.uuid4()),
                "name": "System Admin",
                "email": "admin@company.com",
                "password_hash": hash_password("admin123"),
                "role": "admin",
                "created_at": "2025-01-01T00:00:00Z",
            },
            "marketer@company.com": {
                "id": str(uuid.uuid4()),
                "name": "Sarah Jenkins",
                "email": "marketer@company.com",
                "password_hash": hash_password("market123"),
                "role": "marketer",
                "created_at": "2025-01-01T00:00:00Z",
            },
        }
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(initial_users, f, indent=2)
        return initial_users

    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_users(users: Dict[str, Dict[str, Any]]) -> None:
    """Save users dictionary back to JSON storage."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)


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
async def register(payload: UserRegisterRequest):
    """Register a new user in the AgenticMarketer workspace."""
    users = _load_users()
    email_key = payload.email.lower().strip()

    if email_key in users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user_id = str(uuid.uuid4())
    allowed_roles = ["leader", "admin", "marketer", "backend_dev", "frontend_dev", "user"]
    assigned_role = payload.role.lower() if payload.role and payload.role.lower() in allowed_roles else "marketer"

    new_user = {
        "id": user_id,
        "name": payload.name.strip(),
        "email": email_key,
        "password_hash": hash_password(payload.password),
        "role": assigned_role,
    }

    users[email_key] = new_user
    _save_users(users)

    # Issue JWT token
    token = create_access_token({
        "sub": email_key,
        "name": new_user["name"],
        "role": assigned_role,
        "uid": user_id,
    })

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(
            id=user_id,
            name=new_user["name"],
            email=email_key,
            role=assigned_role,
        ),
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: UserLoginRequest):
    """Authenticate credentials and return a signed JWT access token."""
    users = _load_users()
    email_key = payload.email.lower().strip()

    user = users.get(email_key)
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({
        "sub": email_key,
        "name": user["name"],
        "role": user["role"],
        "uid": user["id"],
    })

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(
            id=user["id"],
            name=user["name"],
            email=email_key,
            role=user["role"],
        ),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve profile and permissions for current authenticated user."""
    users = _load_users()
    email = current_user.get("sub", "")
    user = users.get(email)

    if not user:
        # Return claims from token if user record not found in local file
        return UserProfileResponse(
            id=current_user.get("uid", str(uuid.uuid4())),
            name=current_user.get("name", "User"),
            email=email,
            role=current_user.get("role", "marketer"),
        )

    return UserProfileResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
    )
