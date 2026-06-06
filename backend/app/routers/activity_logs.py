"""
Activity Logs router — read-only access to audit trail.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import RoleChecker
from app.models.user import Role
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogResponse

router = APIRouter(
    prefix="/api/v1/activity-logs",
    tags=["Activity Logs"],
    dependencies=[Depends(RoleChecker([Role.ADMIN, Role.MANAGER]))],
)


@router.get("/", response_model=list[ActivityLogResponse])
async def list_activity_logs(
    user_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    List activity logs with optional filters.
    Filterable by user_id, entity_type, and entity_id.
    """
    query = select(ActivityLog).order_by(ActivityLog.created_at.desc())

    if user_id:
        query = query.where(ActivityLog.user_id == user_id)
    if entity_type:
        query = query.where(ActivityLog.entity_type == entity_type)
    if entity_id:
        query = query.where(ActivityLog.entity_id == entity_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{log_id}", response_model=ActivityLogResponse)
async def get_activity_log(log_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific activity log entry."""
    result = await db.execute(select(ActivityLog).where(ActivityLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Activity log not found."
        )
    return log
