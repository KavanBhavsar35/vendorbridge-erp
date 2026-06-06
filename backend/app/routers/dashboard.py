"""
Dashboard router — aggregation and statistics.
"""

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RoleChecker
from app.models.user import User, Role
from app.models.purchase_order import PurchaseOrder, POStatus
from app.models.quotation import Quotation
from app.models.vendor import Vendor
from app.models.approval import Approval, ApprovalStatus
from app.models.rfq import RFQ, RFQStatus

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieve aggregate statistics for the dashboard overview."""
    
    # 1. Counts
    pending_approvals_count = await db.scalar(
        select(func.count()).select_from(Approval).where(Approval.status == ApprovalStatus.PENDING)
    )
    active_rfqs_count = await db.scalar(
        select(func.count()).select_from(RFQ).where(RFQ.status == RFQStatus.OPEN)
    )
    recent_pos_count = await db.scalar(
        select(func.count()).select_from(PurchaseOrder)
    )

    # 2. Total Spend (sum of all PO amounts that are not cancelled)
    total_spend_query = select(func.sum(PurchaseOrder.total_amount)).where(
        PurchaseOrder.status != POStatus.CANCELLED
    )
    total_spend = await db.scalar(total_spend_query) or 0.0

    # 3. Spend Trend (last 6 months)
    # We will aggregate by month in Python to ensure it works across different SQL dialects easily
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    trend_query = select(PurchaseOrder.created_at, PurchaseOrder.total_amount).where(
        PurchaseOrder.status != POStatus.CANCELLED,
        PurchaseOrder.created_at >= six_months_ago
    )
    trend_result = await db.execute(trend_query)
    
    trend_map = {}
    for created_at, amount in trend_result.all():
        month_str = created_at.strftime("%b")
        trend_map[month_str] = trend_map.get(month_str, 0) + float(amount)
        
    # Generate the last 6 months in order
    spend_trend = []
    for i in range(5, -1, -1):
        d = datetime.utcnow() - timedelta(days=30 * i)
        month_str = d.strftime("%b")
        spend_trend.append({"month": month_str, "spend": trend_map.get(month_str, 0)})

    # 4. Category Spend
    category_query = (
        select(Vendor.category, func.sum(PurchaseOrder.total_amount).label("total"))
        .join(Quotation, Quotation.id == PurchaseOrder.quotation_id)
        .join(Vendor, Vendor.id == Quotation.vendor_id)
        .where(PurchaseOrder.status != POStatus.CANCELLED)
        .group_by(Vendor.category)
    )
    category_result = await db.execute(category_query)
    
    category_spend = [
        {"name": row[0] or "Uncategorized", "value": float(row[1])}
        for row in category_result.all()
    ]

    return {
        "pending_approvals": pending_approvals_count,
        "active_rfqs": active_rfqs_count,
        "recent_pos": recent_pos_count,
        "total_spend": float(total_spend),
        "spend_trend": spend_trend,
        "category_spend": category_spend,
    }
