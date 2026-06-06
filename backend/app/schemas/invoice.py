"""
Invoice schemas — create, update, response.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.invoice import InvoiceStatus


class InvoiceCreate(BaseModel):
    po_id: str
    total_amount: float
    tax_amount: float
    pdf_url: str | None = None


class InvoiceUpdate(BaseModel):
    status: InvoiceStatus | None = None
    total_amount: float | None = None
    tax_amount: float | None = None
    pdf_url: str | None = None


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    po_id: str
    total_amount: float
    tax_amount: float
    status: InvoiceStatus
    pdf_url: str | None
    sent_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
