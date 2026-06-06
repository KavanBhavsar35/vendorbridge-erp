"""
Vendor model — maps to the 'vendors' table.
"""

import enum
from sqlalchemy import String, Float, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VendorStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLACKLISTED = "BLACKLISTED"


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    gst: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[VendorStatus] = mapped_column(
        Enum(VendorStatus, name="vendor_status_enum", create_constraint=True),
        default=VendorStatus.ACTIVE,
        nullable=False,
    )
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    rating: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    created_by = relationship("User", back_populates="vendors", lazy="selectin")
    rfqs = relationship(
        "RFQ", secondary="rfq_vendors", back_populates="vendors", lazy="selectin"
    )
    quotations = relationship("Quotation", back_populates="vendor", lazy="selectin")
