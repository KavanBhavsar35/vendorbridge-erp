"""
Purchase Orders router — create PO from accepted quotation, list, update.
"""

import cuid2
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RoleChecker
from app.models.user import User, Role
from app.models.purchase_order import PurchaseOrder
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderResponse,
)
from app.services.activity_service import log_activity
from app.services.email_service import send_invoice_email

router = APIRouter(prefix="/api/v1/purchase-orders", tags=["Purchase Orders"])


def _generate_po_number() -> str:
    """Generate a unique PO number like PO-20260606-XXXX."""
    now = datetime.now(timezone.utc)
    short_id = cuid2.cuid_wrapper()()[:8]
    return f"PO-{now.strftime('%Y%m%d')}-{short_id.upper()}"


@router.post(
    "/",
    response_model=PurchaseOrderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a Purchase Order from an accepted quotation."""
    # Ensure no PO already exists for this RFQ
    existing = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.rfq_id == payload.rfq_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A Purchase Order already exists for this RFQ.",
        )

    po = PurchaseOrder(
        id=cuid2.cuid_wrapper()(),
        po_number=_generate_po_number(),
        rfq_id=payload.rfq_id,
        quotation_id=payload.quotation_id,
        total_amount=payload.total_amount,
    )
    db.add(po)
    await db.flush()
    await db.refresh(po)

    await log_activity(db, current_user.id, "CREATED", "PurchaseOrder", po.id)
    return po


@router.get("/", response_model=list[PurchaseOrderResponse])
async def list_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all Purchase Orders (paginated)."""
    result = await db.execute(select(PurchaseOrder).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    po_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific Purchase Order by ID."""
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Purchase Order not found."
        )
    return po


@router.put(
    "/{po_id}",
    response_model=PurchaseOrderResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN]))],
)
async def update_purchase_order(
    po_id: str,
    payload: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a Purchase Order status or amount. Admin only."""
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Purchase Order not found."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(po, field, value)

    await db.flush()
    await db.refresh(po)

    await log_activity(db, current_user.id, "UPDATED", "PurchaseOrder", po.id)
    return po

@router.post(
    "/{po_id}/send-email",
    response_model=dict,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def send_po_email_endpoint(
    po_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send the PO to the vendor via email."""
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase Order not found.")

    from app.models.rfq import RFQ
    
    rfq_result = await db.execute(select(RFQ).where(RFQ.id == po.rfq_id))
    real_rfq = rfq_result.scalar_one_or_none()
    
    vendor_email = None
    if real_rfq and real_rfq.vendor:
        vendor_email = real_rfq.vendor.email
        
    if not vendor_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot resolve vendor email for this Purchase Order."
        )

    try:
        await send_invoice_email(
            vendor_email=vendor_email,
            document_type="Purchase Order",
            document_number=po.po_number,
            amount=po.total_amount,
            due_date=po.created_at.strftime("%Y-%m-%d")
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Email sending failed: {str(e)}")

    await log_activity(db, current_user.id, "SENT_EMAIL", "PurchaseOrder", po.id)

    return {"status": "success", "message": f"Email sent to {vendor_email}"}
