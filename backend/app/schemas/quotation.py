"""
Quotation schemas — create, update, response.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.quotation import QuotationStatus


class QuotationCreate(BaseModel):
    rfq_id: str
    vendor_id: str | None = None
    price: float
    delivery_days: int
    notes: str | None = None


class QuotationUpdate(BaseModel):
    price: float | None = None
    delivery_days: int | None = None
    notes: str | None = None


class QuotationResponse(BaseModel):
    id: str
    rfq_id: str
    vendor_id: str
    price: float
    delivery_days: int
    notes: str | None
    status: QuotationStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
