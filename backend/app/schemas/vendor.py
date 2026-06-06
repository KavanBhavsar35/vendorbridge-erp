"""
Vendor schemas — create, update, response.
"""

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.vendor import VendorStatus


class VendorCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    gst: str | None = None
    category: str | None = None
    address: str | None = None


class VendorUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    gst: str | None = None
    category: str | None = None
    status: VendorStatus | None = None
    address: str | None = None
    rating: float | None = None


class VendorResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None
    gst: str | None
    category: str | None
    status: VendorStatus
    address: str | None
    created_by_id: str
    rating: float

    model_config = ConfigDict(from_attributes=True)
