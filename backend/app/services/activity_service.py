"""
Activity logging service — creates audit trail entries.
"""

import cuid2

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog


async def log_activity(
    db: AsyncSession,
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict | None = None,
) -> ActivityLog:
    """
    Create an activity log entry.

    Args:
        db: Database session.
        user_id: ID of the user performing the action.
        action: Description of the action (e.g. "CREATED", "UPDATED", "DELETED").
        entity_type: Type of entity (e.g. "Vendor", "RFQ").
        entity_id: ID of the affected entity.
        details: Optional JSON-serializable details.

    Returns:
        The created ActivityLog record.
    """
    log = ActivityLog(
        id=cuid2.cuid_wrapper()(),
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(log)
    await db.flush()
    return log
