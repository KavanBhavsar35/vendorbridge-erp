"""
RFQ (Request for Quotation) router — CRUD + vendor assignment.
"""

import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RoleChecker
from app.models.user import User, Role
from app.models.rfq import RFQ
from app.models.vendor import Vendor
from app.schemas.rfq import RFQCreate, RFQUpdate, RFQAssignVendors, RFQResponse
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/v1/rfqs", tags=["RFQs"])


@router.post(
    "/",
    response_model=RFQResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def create_rfq(
    payload: RFQCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new Request for Quotation."""
    rfq = RFQ(
        id=cuid2.cuid_wrapper()(),
        title=payload.title,
        description=payload.description,
        products=payload.products,
        deadline=payload.deadline,
        created_by_id=current_user.id,
    )
    db.add(rfq)
    await db.flush()

    # Optionally assign vendors on creation
    if payload.vendor_ids:
        result = await db.execute(
            select(Vendor).where(Vendor.id.in_(payload.vendor_ids))
        )
        vendors = result.scalars().all()
        rfq.vendors = list(vendors)
        await db.flush()

    await db.refresh(rfq)
    await log_activity(db, current_user.id, "CREATED", "RFQ", rfq.id)
    return rfq


@router.get("/", response_model=list[RFQResponse])
async def list_rfqs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List RFQs with optional status filter and pagination."""
    query = select(RFQ)
    if status_filter:
        query = query.where(RFQ.status == status_filter)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{rfq_id}", response_model=RFQResponse)
async def get_rfq(
    rfq_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific RFQ by ID."""
    result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = result.scalar_one_or_none()
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found.")
    return rfq


@router.put(
    "/{rfq_id}",
    response_model=RFQResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def update_rfq(
    rfq_id: str,
    payload: RFQUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing RFQ."""
    result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = result.scalar_one_or_none()
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rfq, field, value)

    await db.flush()
    await db.refresh(rfq)

    await log_activity(db, current_user.id, "UPDATED", "RFQ", rfq.id)
    return rfq


@router.delete(
    "/{rfq_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RoleChecker([Role.ADMIN]))],
)
async def delete_rfq(
    rfq_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an RFQ. Admin only."""
    result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    rfq = result.scalar_one_or_none()
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found.")

    await log_activity(db, current_user.id, "DELETED", "RFQ", rfq.id)
    await db.delete(rfq)
    await db.flush()


@router.post(
    "/{rfq_id}/vendors",
    response_model=RFQResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def assign_vendors_to_rfq(
    rfq_id: str,
    payload: RFQAssignVendors,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign vendors to an RFQ."""
    result = await db.execute(
        select(RFQ).options(selectinload(RFQ.vendors)).where(RFQ.id == rfq_id)
    )
    rfq = result.scalar_one_or_none()
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found.")

    vendor_result = await db.execute(
        select(Vendor).where(Vendor.id.in_(payload.vendor_ids))
    )
    vendors = vendor_result.scalars().all()

    if len(vendors) != len(payload.vendor_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more vendor IDs are invalid.",
        )

    rfq.vendors = list(vendors)
    await db.flush()
    await db.refresh(rfq)

    await log_activity(
        db, current_user.id, "ASSIGNED_VENDORS", "RFQ", rfq.id,
        details={"vendor_ids": payload.vendor_ids},
    )
    return rfq
