"""
Vendors router — CRUD operations for vendor management.
"""

import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RoleChecker
from app.models.user import User, Role
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/v1/vendors", tags=["Vendors"])


@router.post(
    "/",
    response_model=VendorResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def create_vendor(
    payload: VendorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new vendor."""
    # Check duplicate email
    existing = await db.execute(select(Vendor).where(Vendor.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A vendor with this email already exists.",
        )

    vendor = Vendor(
        id=cuid2.cuid_wrapper()(),
        created_by_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(vendor)
    await db.flush()
    await db.refresh(vendor)

    await log_activity(db, current_user.id, "CREATED", "Vendor", vendor.id)
    return vendor


@router.get("/", response_model=list[VendorResponse])
async def list_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List vendors with optional filtering and pagination."""
    query = select(Vendor)
    if category:
        query = query.where(Vendor.category == category)
    if status_filter:
        query = query.where(Vendor.status == status_filter)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific vendor by ID."""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")
    return vendor


@router.put(
    "/{vendor_id}",
    response_model=VendorResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def update_vendor(
    vendor_id: str,
    payload: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing vendor."""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vendor, field, value)

    await db.flush()
    await db.refresh(vendor)

    await log_activity(db, current_user.id, "UPDATED", "Vendor", vendor.id)
    return vendor


@router.delete(
    "/{vendor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RoleChecker([Role.ADMIN]))],
)
async def delete_vendor(
    vendor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a vendor. Admin only."""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    await log_activity(db, current_user.id, "DELETED", "Vendor", vendor.id)
    await db.delete(vendor)
    await db.flush()
