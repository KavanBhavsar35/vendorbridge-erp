"""
User schemas — create, update, response.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    role: Role = Role.PROCUREMENT_OFFICER


class UserUpdate(BaseModel):
    name: str | None = None
    role: Role | None = None
    email: EmailStr | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    role: Role
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
