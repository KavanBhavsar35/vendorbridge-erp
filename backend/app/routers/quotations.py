"""
Quotations router — submit, list, update, accept/reject quotations.
"""

import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RoleChecker
from app.models.user import User, Role
from app.models.vendor import Vendor
from app.models.quotation import Quotation, QuotationStatus
from app.schemas.quotation import QuotationCreate, QuotationUpdate, QuotationResponse
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/v1/quotations", tags=["Quotations"])


@router.post(
    "/",
    response_model=QuotationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker([Role.VENDOR, Role.ADMIN]))],
)
async def create_quotation(
    payload: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a new quotation for an RFQ."""
    # Ensure vendor profile exists for the logged in user
    vendor_result = await db.execute(select(Vendor).where(Vendor.email == current_user.email))
    vendor = vendor_result.scalar_one_or_none()
    
    if not vendor:
        vendor = Vendor(
            id=current_user.id,
            name=current_user.name or current_user.email,
            email=current_user.email,
            created_by_id=current_user.id
        )
        db.add(vendor)
        await db.flush()

    quotation = Quotation(
        id=cuid2.cuid_wrapper()(),
        rfq_id=payload.rfq_id,
        vendor_id=vendor.id,
        price=payload.price,
        delivery_days=payload.delivery_days,
        notes=payload.notes,
    )
    db.add(quotation)
    await db.flush()
    await db.refresh(quotation)

    await log_activity(db, current_user.id, "CREATED", "Quotation", quotation.id)
    return quotation


@router.get("/", response_model=list[QuotationResponse])
async def list_quotations(
    rfq_id: str | None = None,
    vendor_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List quotations with optional filters."""
    query = select(Quotation)
    if rfq_id:
        query = query.where(Quotation.rfq_id == rfq_id)
    if vendor_id:
        query = query.where(Quotation.vendor_id == vendor_id)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{quotation_id}", response_model=QuotationResponse)
async def get_quotation(
    quotation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific quotation by ID."""
    result = await db.execute(select(Quotation).where(Quotation.id == quotation_id))
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")
    return quotation


@router.put(
    "/{quotation_id}",
    response_model=QuotationResponse,
    dependencies=[Depends(RoleChecker([Role.VENDOR, Role.ADMIN]))],
)
async def update_quotation(
    quotation_id: str,
    payload: QuotationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a quotation (price, delivery days, notes)."""
    result = await db.execute(select(Quotation).where(Quotation.id == quotation_id))
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    if quotation.status != QuotationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING quotations can be updated.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quotation, field, value)

    await db.flush()
    await db.refresh(quotation)

    await log_activity(db, current_user.id, "UPDATED", "Quotation", quotation.id)
    return quotation


@router.put(
    "/{quotation_id}/accept",
    response_model=QuotationResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.MANAGER]))],
)
async def accept_quotation(
    quotation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a quotation. Admin or Manager only."""
    result = await db.execute(select(Quotation).where(Quotation.id == quotation_id))
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    quotation.status = QuotationStatus.ACCEPTED
    await db.flush()
    await db.refresh(quotation)

    await log_activity(db, current_user.id, "ACCEPTED", "Quotation", quotation.id)
    return quotation


@router.put(
    "/{quotation_id}/reject",
    response_model=QuotationResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.MANAGER]))],
)
async def reject_quotation(
    quotation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a quotation. Admin or Manager only."""
    result = await db.execute(select(Quotation).where(Quotation.id == quotation_id))
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    quotation.status = QuotationStatus.REJECTED
    await db.flush()
    await db.refresh(quotation)

    await log_activity(db, current_user.id, "REJECTED", "Quotation", quotation.id)
    return quotation
