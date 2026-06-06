"""
Approvals router — create approval requests, approve/reject.
"""

import cuid2
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RoleChecker
from app.models.user import User, Role
from app.models.approval import Approval, ApprovalStatus
from app.schemas.approval import ApprovalCreate, ApprovalAction, ApprovalResponse
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/v1/approvals", tags=["Approvals"])


@router.post(
    "/",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.PROCUREMENT_OFFICER]))],
)
async def create_approval(
    payload: ApprovalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new approval request for an RFQ."""
    approval = Approval(
        id=cuid2.cuid_wrapper()(),
        rfq_id=payload.rfq_id,
        approver_id=payload.approver_id,
        remarks=payload.remarks,
    )
    db.add(approval)
    await db.flush()
    await db.refresh(approval)

    await log_activity(db, current_user.id, "CREATED", "Approval", approval.id)
    return approval


@router.get(
    "/",
    response_model=list[ApprovalResponse],
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.MANAGER]))],
)
async def list_approvals(
    rfq_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List approval requests with optional RFQ filter."""
    query = select(Approval)
    if rfq_id:
        query = query.where(Approval.rfq_id == rfq_id)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/{approval_id}",
    response_model=ApprovalResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.MANAGER]))],
)
async def get_approval(approval_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific approval request by ID."""
    result = await db.execute(select(Approval).where(Approval.id == approval_id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")
    return approval


@router.put(
    "/{approval_id}/approve",
    response_model=ApprovalResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.MANAGER]))],
)
async def approve(
    approval_id: str,
    payload: ApprovalAction | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve an approval request."""
    result = await db.execute(select(Approval).where(Approval.id == approval_id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")

    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING approvals can be approved.",
        )

    approval.status = ApprovalStatus.APPROVED
    approval.approved_at = datetime.now(timezone.utc)
    if payload and payload.remarks:
        approval.remarks = payload.remarks

    await db.flush()
    await db.refresh(approval)

    await log_activity(db, current_user.id, "APPROVED", "Approval", approval.id)
    return approval


@router.put(
    "/{approval_id}/reject",
    response_model=ApprovalResponse,
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.MANAGER]))],
)
async def reject(
    approval_id: str,
    payload: ApprovalAction | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject an approval request."""
    result = await db.execute(select(Approval).where(Approval.id == approval_id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")

    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING approvals can be rejected.",
        )

    approval.status = ApprovalStatus.REJECTED
    if payload and payload.remarks:
        approval.remarks = payload.remarks

    await db.flush()
    await db.refresh(approval)

    await log_activity(db, current_user.id, "REJECTED", "Approval", approval.id)
    return approval
