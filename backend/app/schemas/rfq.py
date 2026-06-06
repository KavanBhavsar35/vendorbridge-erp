"""
RFQ schemas — create, update, response.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.rfq import RFQStatus


class RFQCreate(BaseModel):
    title: str
    description: str | None = None
    products: list[dict[str, Any]] | None = None  # [{name, quantity, unit}]
    deadline: datetime
    vendor_ids: list[str] | None = None  # optional: assign vendors on creation


class RFQUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    products: list[dict[str, Any]] | None = None
    deadline: datetime | None = None
    status: RFQStatus | None = None


class RFQAssignVendors(BaseModel):
    vendor_ids: list[str]


class RFQResponse(BaseModel):
    id: str
    title: str
    description: str | None
    products: Any | None
    deadline: datetime
    status: RFQStatus
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
