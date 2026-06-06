"""
Invoices router — create, list, update invoices.
"""

import cuid2
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RoleChecker
from app.models.user import User, Role
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.services.activity_service import log_activity
from app.services.email_service import send_invoice_email

router = APIRouter(prefix="/api/v1/invoices", tags=["Invoices"])


def _generate_invoice_number() -> str:
    """Generate a unique invoice number like INV-20260606-XXXX."""
    now = datetime.now(timezone.utc)
    short_id = cuid2.cuid_wrapper()()[:8]
    return f"INV-{now.strftime('%Y%m%d')}-{short_id.upper()}"


@router.post(
    "/",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def create_invoice(
    payload: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an invoice for a Purchase Order."""
    # Ensure no invoice already exists for this PO
    existing = await db.execute(select(Invoice).where(Invoice.po_id == payload.po_id))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An Invoice already exists for this Purchase Order.",
        )

    invoice = Invoice(
        id=cuid2.cuid_wrapper()(),
        invoice_number=_generate_invoice_number(),
        po_id=payload.po_id,
        total_amount=payload.total_amount,
        tax_amount=payload.tax_amount,
        pdf_url=payload.pdf_url,
    )
    db.add(invoice)
    await db.flush()
    await db.refresh(invoice)

    await log_activity(db, current_user.id, "CREATED", "Invoice", invoice.id)
    return invoice


@router.get("/", response_model=list[InvoiceResponse])
async def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all invoices (paginated)."""
    result = await db.execute(select(Invoice).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific invoice by ID."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
    return invoice


@router.put(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN]))],
)
async def update_invoice(
    invoice_id: str,
    payload: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an invoice. Admin only."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)

    await db.flush()
    await db.refresh(invoice)

    await log_activity(db, current_user.id, "UPDATED", "Invoice", invoice.id)
    return invoice

@router.post(
    "/{invoice_id}/send-email",
    response_model=dict,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def send_invoice_email_endpoint(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send the invoice to the vendor via email."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    po = invoice.po
    # Navigate the object graph correctly. Note: wait, rfq may not be loaded if lazy='selectin' wasn't used for all.
    # Let's ensure we fetch the vendor explicitly to be safe if relations are missing.
    from app.models.purchase_order import PurchaseOrder
    from app.models.rfq import RFQ
    from app.models.vendor import Vendor
    
    po_result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == invoice.po_id))
    real_po = po_result.scalar_one_or_none()
    
    rfq_result = await db.execute(select(RFQ).where(RFQ.id == real_po.rfq_id))
    real_rfq = rfq_result.scalar_one_or_none()
    
    vendor_email = None
    if real_rfq and real_rfq.vendor:
        vendor_email = real_rfq.vendor.email
        
    if not vendor_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot resolve vendor email for this invoice."
        )

    try:
        await send_invoice_email(
            vendor_email=vendor_email,
            document_type="Invoice",
            document_number=invoice.invoice_number,
            amount=invoice.total_amount,
            due_date=invoice.created_at.strftime("%Y-%m-%d")
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Email sending failed: {str(e)}")

    invoice.sent_at = datetime.now(timezone.utc)
    await db.flush()
    await log_activity(db, current_user.id, "SENT_EMAIL", "Invoice", invoice.id)

    return {"status": "success", "message": f"Email sent to {vendor_email}"}
