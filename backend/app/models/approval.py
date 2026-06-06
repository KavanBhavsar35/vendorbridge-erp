"""
Approval model — maps to the 'approvals' table.
"""

import enum
from datetime import datetime

from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    rfq_id: Mapped[str] = mapped_column(
        String, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False
    )
    approver_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus, name="approval_status_enum", create_constraint=True),
        default=ApprovalStatus.PENDING,
        nullable=False,
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    rfq = relationship("RFQ", back_populates="approvals", lazy="selectin")
    approver = relationship("User", back_populates="approvals", lazy="selectin")
