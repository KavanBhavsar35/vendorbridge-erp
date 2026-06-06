"""
RFQ (Request for Quotation) model — maps to the 'rfqs' table.
Also defines the rfq_vendors association table for the many-to-many relationship.
"""

import enum
from datetime import datetime

from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, Table, Column, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RFQStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    AWARDED = "AWARDED"


# Many-to-many association table: RFQ <-> Vendor
rfq_vendors = Table(
    "rfq_vendors",
    Base.metadata,
    Column("rfq_id", String, ForeignKey("rfqs.id", ondelete="CASCADE"), primary_key=True),
    Column("vendor_id", String, ForeignKey("vendors.id", ondelete="CASCADE"), primary_key=True),
)


class RFQ(Base):
    __tablename__ = "rfqs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    products: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[RFQStatus] = mapped_column(
        Enum(RFQStatus, name="rfq_status_enum", create_constraint=True),
        default=RFQStatus.OPEN,
        nullable=False,
    )
    created_by_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    created_by = relationship("User", back_populates="rfqs", lazy="selectin")
    vendors = relationship(
        "Vendor", secondary=rfq_vendors, back_populates="rfqs", lazy="selectin"
    )
    quotations = relationship("Quotation", back_populates="rfq", lazy="selectin")
    po = relationship("PurchaseOrder", back_populates="rfq", uselist=False, lazy="selectin")
    approvals = relationship("Approval", back_populates="rfq", lazy="selectin")
