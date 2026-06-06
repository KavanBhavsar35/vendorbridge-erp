"""
PurchaseOrder schemas — create, update, response.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.purchase_order import POStatus


class PurchaseOrderCreate(BaseModel):
    rfq_id: str
    quotation_id: str
    total_amount: float


class PurchaseOrderUpdate(BaseModel):
    status: POStatus | None = None
    total_amount: float | None = None


class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    rfq_id: str
    quotation_id: str
    total_amount: float
    status: POStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
