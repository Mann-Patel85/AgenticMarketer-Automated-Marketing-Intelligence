"""
AgenticMarketer Backend — Authentication Router.
Production Authentication, Google OAuth 2.0 Integration, Transactional Emails,
JWT Token Issuance, Strict Role-Based Access Control (RBAC), and 10-Operator Seat Limit.
"""

import os
import uuid
import json
import base64
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import httpx
from pydantic import BaseModel, Field, EmailStr
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db, User, UserSession
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    get_current_user,
    require_roles,
)
from backend.app.services.email import send_welcome_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Strict Global Limit on Operator Seats
MAX_OPERATOR_SEATS = 10

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()


def _get_frontend_url(request: Request) -> str:
    """Resolves production or local frontend origin for OAuth redirects."""
    configured = os.getenv("FRONTEND_PROD_URL", "").strip()
    if configured:
        parsed = urllib.parse.urlparse(configured)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
        return configured.rstrip("/")
    referer = request.headers.get("referer")
    if referer:
        parsed = urllib.parse.urlparse(referer)
        return f"{parsed.scheme}://{parsed.netloc}"
    origin = request.headers.get("origin")
    if origin:
        return origin.rstrip("/")
    return "https://agentic-marketer-automated-marketin.vercel.app"


def _get_backend_url(request: Request) -> str:
    """Resolves production backend base URL with HTTPS support."""
    configured = os.getenv("BACKEND_PROD_URL", "").strip().rstrip("/")
    if configured:
        return configured
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", "localhost:8000"))
    return f"{proto}://{host}"


# ── Request / Response Schemas ───────────────────────────────────────

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=100)
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=100)


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


# ── Production Credentials Endpoints ─────────────────────────────────

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user in the AgenticMarketer workspace.
    Enforces the strict MAX_OPERATOR_SEATS (10) capacity cap.
    """
    email_key = payload.email.lower().strip()
    admin_email = os.getenv("ADMIN_EMAIL", "mann@company.com").lower().strip()

    existing_user = db.query(User).filter(User.email == email_key).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in.",
        )

    # 1. Enforce 10-Operator Seat Limit
    current_seats = db.query(User).count()
    if current_seats >= MAX_OPERATOR_SEATS and email_key != admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operator seat limit reached ({MAX_OPERATOR_SEATS}/{MAX_OPERATOR_SEATS} seats filled). Contact the administrator for workspace clearance.",
        )

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

    # Trigger welcome email (non-blocking)
    try:
        import asyncio
        asyncio.create_task(send_welcome_email(email_key, new_user.name))
    except Exception as exc:
        print(f"[Auth] Warning: Could not enqueue welcome email: {exc}")

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
    """Authenticate user credentials against PostgreSQL and return a signed JWT access token."""
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


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Dispatches a secure password reset link via SMTP / Resend."""
    email_key = payload.email.lower().strip()
    frontend_url = _get_frontend_url(request)

    user = db.query(User).filter(User.email == email_key).first()
    if user:
        reset_token = create_access_token(
            {"sub": email_key, "purpose": "password_reset"},
            expires_delta=timedelta(hours=1),
        )
        reset_url = f"{frontend_url}/login?reset_token={reset_token}"
        try:
            import asyncio
            asyncio.create_task(send_password_reset_email(email_key, reset_url))
        except Exception as exc:
            print(f"[Auth] Warning: Could not dispatch password reset email: {exc}")

    return {
        "message": f"If an account exists for {email_key}, password recovery instructions have been dispatched.",
        "status": "dispatched",
    }


# ── Google OAuth 2.0 Integration ─────────────────────────────────────

@router.get("/google/login")
async def google_login(request: Request):
    """Initiates Google OAuth 2.0 authorization redirect."""
    frontend_url = _get_frontend_url(request)

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        print("[OAuth Warning] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured.")
        return RedirectResponse(
            url=f"{frontend_url}/login?error=Google+OAuth+is+not+configured+yet.+Please+use+Email+and+Password+login."
        )

    backend_url = _get_backend_url(request)
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI") or f"{backend_url}/api/auth/google/callback"

    # Encode client frontend origin into state so callback always returns to the right domain
    state_payload = {
        "nonce": str(uuid.uuid4())[:8],
        "frontend": frontend_url,
    }
    encoded_state = base64.urlsafe_b64encode(json.dumps(state_payload).encode()).decode()

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": encoded_state,
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Handles Google OAuth redirect:
    1. Extracts state to resolve original frontend domain.
    2. Exchanges authorization code for tokens.
    3. Retrieves user profile from Google.
    4. Enforces MAX_OPERATOR_SEATS (10) capacity cap.
    5. Allows existing users to log in cleanly.
    6. Issues signed JWT and redirects to frontend /auth/callback.
    """
    # Resolve originating frontend origin from state
    frontend_url = _get_frontend_url(request)
    if state:
        try:
            state_data = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
            if state_data.get("frontend"):
                frontend_url = state_data["frontend"].rstrip("/")
        except Exception:
            pass

    if error:
        return RedirectResponse(url=f"{frontend_url}/login?error=Google+OAuth+cancelled+or+failed:+{error}")

    if not code:
        return RedirectResponse(url=f"{frontend_url}/login?error=Missing+Google+authorization+code.")

    backend_url = _get_backend_url(request)
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI") or f"{backend_url}/api/auth/google/callback"

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(token_url, data=token_data)
            if token_resp.status_code != 200:
                print(f"[OAuth Error] Token exchange failed ({token_resp.status_code}): {token_resp.text}")
                return RedirectResponse(url=f"{frontend_url}/login?error=Google+token+exchange+failed.")

            token_json = token_resp.json()
            access_token = token_json.get("access_token")

            # Retrieve Google User Profile
            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                return RedirectResponse(url=f"{frontend_url}/login?error=Could+not+retrieve+Google+user+profile.")

            google_user = userinfo_resp.json()

    except Exception as exc:
        print(f"[OAuth Exception] Google authorization exception: {exc}")
        return RedirectResponse(url=f"{frontend_url}/login?error=OAuth+connection+failed.+Please+try+again.")

    google_email = google_user.get("email", "").lower().strip()
    google_name = google_user.get("name", google_email.split("@")[0].title())

    if not google_email:
        return RedirectResponse(url=f"{frontend_url}/login?error=No+email+associated+with+Google+account.")

    admin_email = os.getenv("ADMIN_EMAIL", "mann@company.com").lower().strip()
    user = db.query(User).filter(User.email == google_email).first()

    # ── Seat Cap Enforcement for New Registrations ─────────────────────
    if not user:
        current_seats = db.query(User).count()
        # If total seats >= 10 and not the primary admin, reject immediately
        if current_seats >= MAX_OPERATOR_SEATS and google_email != admin_email:
            print(f"[Auth Security] Google OAuth rejected for {google_email}: Workspace seat limit reached ({current_seats}/{MAX_OPERATOR_SEATS}).")
            return RedirectResponse(url=f"{frontend_url}/login?error=seat_limit_reached")

        # Provision new operator
        assigned_role = "admin" if google_email == admin_email else "user"
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            name=google_name,
            email=google_email,
            password_hash=hash_password(str(uuid.uuid4())),
            role=assigned_role,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Send welcome email asynchronously
        try:
            import asyncio
            asyncio.create_task(send_welcome_email(google_email, google_name))
        except Exception as exc:
            print(f"[OAuth] Warning: Could not dispatch welcome email: {exc}")

    # ── Issue Signed Platform JWT ─────────────────────────────────────
    jwt_token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "role": user.role,
        "uid": user.id,
    })

    # Track session
    session_record = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=jwt_token[-16:],
        created_at=datetime.now(timezone.utc),
    )
    db.add(session_record)
    db.commit()

    # Deliver token via URL parameter AND cookie for maximum compatibility
    redirect_target = f"{frontend_url}/auth/callback?token={jwt_token}"
    response = RedirectResponse(url=redirect_target, status_code=302)
    response.set_cookie(
        key="token",
        value=jwt_token,
        max_age=604800,
        path="/",
        samesite="lax",
        secure=True,
    )
    return response


# ── Profile & Users Queries ──────────────────────────────────────────

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
