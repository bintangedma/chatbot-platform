import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.user import UserResponse

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: EmailStr) -> str:
        """Normalize email casing to prevent duplicate accounts due to capitalization."""
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_must_contain_number(cls, v: str) -> str:
        """Validate that password contains at least one numeric digit."""
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: EmailStr) -> str:
        """Normalize email casing for consistent login queries."""
        return v.lower()

class AuthResponseData(BaseModel):
    user: UserResponse
    access_token: str

class RefreshResponseData(BaseModel):
    access_token: str

class MessageResponseData(BaseModel):
    message: str
