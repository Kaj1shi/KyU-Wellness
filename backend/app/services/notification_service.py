from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Escalation, Notification, User
from app.models.enums import NotificationType


def notification_to_dict(notification: Notification) -> dict:
    return {
        "id": str(notification.id),
        "notification_type": notification.notification_type.value,
        "title": notification.title,
        "body": notification.body,
        "read": notification.read,
        "metadata": notification.metadata_,
        "created_at": notification.created_at.isoformat(),
    }


def list_notifications(db: Session, user: User, *, limit: int = 50) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def unread_count(db: Session, user: User) -> int:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.read.is_(False))
        .count()
    )


def mark_read(db: Session, user: User, notification_id: UUID) -> Notification | None:
    record = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not record:
        return None
    record.read = True
    db.commit()
    db.refresh(record)
    return record


def mark_all_read(db: Session, user: User) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.read.is_(False))
        .update({Notification.read: True})
    )
    db.commit()
    return updated


def create_crisis_notification(
    db: Session,
    *,
    counselor: User,
    escalation: Escalation,
    student_label: str,
    distress_level: str,
) -> Notification:
    notification = Notification(
        user_id=counselor.id,
        notification_type=NotificationType.CRISIS_ALERT,
        title=f"Crisis alert: {distress_level}",
        body=f"A student ({student_label}) may need immediate support. Review the escalation in your dashboard.",
        read=False,
        metadata_={
            "escalation_id": str(escalation.id),
            "student_id": str(escalation.user_id),
            "distress_level": distress_level,
        },
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
