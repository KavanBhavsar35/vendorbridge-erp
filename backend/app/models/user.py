"""
User model — maps to the 'users' table.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import String, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    PROCUREMENT_OFFICER = "PROCUREMENT_OFFICER"
    VENDOR = "VENDOR"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[Role] = mapped_column(
        Enum(Role, name="role_enum", create_constraint=True),
        default=Role.PROCUREMENT_OFFICER,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    vendors = relationship("Vendor", back_populates="created_by", lazy="selectin")
    rfqs = relationship("RFQ", back_populates="created_by", lazy="selectin")
    approvals = relationship("Approval", back_populates="approver", lazy="selectin")
    activities = relationship("ActivityLog", back_populates="user", lazy="selectin")
