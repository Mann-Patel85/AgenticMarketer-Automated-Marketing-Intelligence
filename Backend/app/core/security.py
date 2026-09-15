"""
AgenticMarketer Backend — Security & Authentication Utilities.
- Password hashing and verification using native bcrypt
- JWT access token generation and validation
- FastAPI dependencies for authentication and RBAC
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.app.core.config import get_settings

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (capped at 72 bytes)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token with auto-sanitization."""
    settings = get_settings()
    
    # Auto-sanitize if user accidentally pasted full JSON or quotes into Swagger
    token = token.strip()
    if token.startswith("{") and "access_token" in token:
        try:
            import json
            data = json.loads(token)
            token = data.get("access_token", token).strip()
        except Exception:
            import re
            m = re.search(r'"access_token":\s*"([^"]+)"', token)
            if m:
                token = m.group(1).strip()

    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    token = token.strip("\"'")

    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> dict:
    """
    FastAPI dependency that extracts and validates the user from the Bearer token.
    Falls back gracefully for local developer convenience if needed.
    """
    if credentials is None or not credentials.credentials:
        # Check if running in development mode without header
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identifier",
        )
    return payload


def require_roles(allowed_roles: List[str]):
    """Role-Based Access Control (RBAC) dependency factory."""
    def role_checker(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role", "marketer").lower()
        normalized_allowed = [r.lower() for r in allowed_roles]
        if user_role not in normalized_allowed and "all" not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{user_role}' is not in allowed roles: {allowed_roles}",
            )
        return user

    return role_checker
