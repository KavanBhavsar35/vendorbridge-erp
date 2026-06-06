"""
Quotation model — maps to the 'quotations' table.
"""

import enum
from datetime import datetime

from sqlalchemy import String, Integer, Numeric, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuotationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class Quotation(Base):
    __tablename__ = "quotations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    rfq_id: Mapped[str] = mapped_column(
        String, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False
    )
    vendor_id: Mapped[str] = mapped_column(
        String, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False
    )
    price: Mapped[float] = mapped_column(Numeric(precision=12, scale=2), nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[QuotationStatus] = mapped_column(
        Enum(QuotationStatus, name="quotation_status_enum", create_constraint=True),
        default=QuotationStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    rfq = relationship("RFQ", back_populates="quotations", lazy="selectin")
    vendor = relationship("Vendor", back_populates="quotations", lazy="selectin")
