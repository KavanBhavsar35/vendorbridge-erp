"""
PurchaseOrder model — maps to the 'purchase_orders' table.
"""

import enum
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class POStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    po_number: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    rfq_id: Mapped[str] = mapped_column(
        String, ForeignKey("rfqs.id"), unique=True, nullable=False
    )
    quotation_id: Mapped[str] = mapped_column(String, nullable=False)
    total_amount: Mapped[float] = mapped_column(
        Numeric(precision=14, scale=2), nullable=False
    )
    status: Mapped[POStatus] = mapped_column(
        Enum(POStatus, name="po_status_enum", create_constraint=True),
        default=POStatus.DRAFT,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    rfq = relationship("RFQ", back_populates="po", lazy="selectin")
    invoice = relationship(
        "Invoice", back_populates="po", uselist=False, lazy="selectin"
    )
