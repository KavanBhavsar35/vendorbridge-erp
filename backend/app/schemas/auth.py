"""
Auth schemas — login, register, and token response.
"""

from pydantic import BaseModel, EmailStr

from app.models.user import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    role: Role = Role.PROCUREMENT_OFFICER


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
