import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Hash a password using native bcrypt library (avoiding passlib compatibility issues)."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against its native bcrypt hash."""
    try:
        password_bytes = plain.encode("utf-8")
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(subject: str) -> str:
    """Create a signed JWT access token for a subject (user ID)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRY_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_ACCESS_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> tuple[str, str]:
    """Generate a random refresh token and returns (raw_token, hashed_token)."""
    raw_token = secrets.token_urlsafe(64)
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, hashed_token

def decode_access_token(token: str) -> str:
    """Decode a JWT access token, returning the subject, or raises 401."""
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=[ALGORITHM])
        subject: str | None = payload.get("sub")
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return subject
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
