"""
ActivityLog schemas — response only (logs are created internally).
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    details: Any | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
