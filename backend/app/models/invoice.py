"""
Invoice model — maps to the 'invoices' table.
"""

import enum
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InvoiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    invoice_number: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True
    )
    po_id: Mapped[str] = mapped_column(
        String, ForeignKey("purchase_orders.id"), unique=True, nullable=False
    )
    total_amount: Mapped[float] = mapped_column(
        Numeric(precision=14, scale=2), nullable=False
    )
    tax_amount: Mapped[float] = mapped_column(
        Numeric(precision=14, scale=2), nullable=False
    )
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status_enum", create_constraint=True),
        default=InvoiceStatus.PENDING,
        nullable=False,
    )
    pdf_url: Mapped[str | None] = mapped_column(String, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    po = relationship("PurchaseOrder", back_populates="invoice", lazy="selectin")
