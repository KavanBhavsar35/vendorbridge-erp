"""
Approval schemas — create, update, response.
"""

from datetime import datetime
import typing

from pydantic import BaseModel, ConfigDict

from app.models.approval import ApprovalStatus
from app.schemas.rfq import RFQResponse


class ApprovalCreate(BaseModel):
    rfq_id: str
    approver_id: str
    remarks: str | None = None


class ApprovalAction(BaseModel):
    remarks: str | None = None


class ApprovalResponse(BaseModel):
    id: str
    rfq_id: str
    approver_id: str
    status: ApprovalStatus
    remarks: str | None
    approved_at: datetime | None
    created_at: datetime
    rfq: RFQResponse | None = None

    model_config = ConfigDict(from_attributes=True)
