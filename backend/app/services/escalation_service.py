from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.config.settings import settings
from app.models import ChatMessage, DistressResult, Escalation, Notification, User
from app.models.enums import DistressLevel, EscalationStatus, NotificationType, UserRole
from app.services.email_service import send_crisis_alert_email
from app.services.notification_service import create_crisis_notification


def _student_label(user: User) -> str:
    if user.is_anonymous:
        return user.nickname or "Anonymous student"
    return user.nickname or user.email or "Student"


def escalation_to_dict(escalation: Escalation, student: User | None = None) -> dict:
    data = {
        "id": str(escalation.id),
        "user_id": str(escalation.user_id),
        "message_id": str(escalation.message_id) if escalation.message_id else None,
        "level": escalation.level.value,
        "status": escalation.status.value,
        "distress_snapshot": escalation.distress_snapshot,
        "counselor_notes": escalation.counselor_notes,
        "created_at": escalation.created_at.isoformat(),
        "resolved_at": escalation.resolved_at.isoformat() if escalation.resolved_at else None,
        "student": None,
    }
    if student:
        data["student"] = {
            "id": str(student.id),
            "nickname": student.nickname,
            "email": None if student.is_anonymous else student.email,
            "faculty": student.faculty,
            "year_of_study": student.year_of_study,
            "is_anonymous": student.is_anonymous,
        }
    return data


def get_escalation_by_message(db: Session, message_id: UUID) -> Escalation | None:
    return db.query(Escalation).filter(Escalation.message_id == message_id).first()


def list_escalations(
    db: Session,
    *,
    status: EscalationStatus | None = None,
    limit: int = 50,
) -> list[tuple[Escalation, User]]:
    query = db.query(Escalation, User).join(User, Escalation.user_id == User.id)
    if status:
        query = query.filter(Escalation.status == status)
    return query.order_by(Escalation.created_at.desc()).limit(limit).all()


def get_escalation(db: Session, escalation_id: UUID) -> tuple[Escalation, User] | None:
    row = (
        db.query(Escalation, User)
        .join(User, Escalation.user_id == User.id)
        .filter(Escalation.id == escalation_id)
        .first()
    )
    return row


def update_escalation(
    db: Session,
    escalation: Escalation,
    *,
    status: EscalationStatus | None = None,
    counselor_notes: str | None = None,
) -> Escalation:
    if status:
        escalation.status = status
        if status == EscalationStatus.RESOLVED:
            escalation.resolved_at = datetime.now(timezone.utc)
    if counselor_notes is not None:
        escalation.counselor_notes = counselor_notes
    db.commit()
    db.refresh(escalation)
    return escalation


async def maybe_escalate(
    db: Session,
    student: User,
    message: ChatMessage,
    distress_record: DistressResult,
    *,
    requires_escalation: bool,
) -> Escalation | None:
    if not requires_escalation:
        return None

    existing = get_escalation_by_message(db, message.id)
    if existing:
        return existing

    snapshot = {
        "level": distress_record.level.value,
        "indicators": distress_record.indicators,
        "rule_matches": distress_record.rule_matches,
        "ai_analysis": distress_record.ai_analysis,
        "message_excerpt": message.content[:500],
    }

    escalation = Escalation(
        user_id=student.id,
        message_id=message.id,
        level=distress_record.level,
        status=EscalationStatus.OPEN,
        distress_snapshot=snapshot,
    )
    db.add(escalation)
    db.commit()
    db.refresh(escalation)

    await _dispatch_crisis_alerts(db, escalation, student, message)
    return escalation


async def _dispatch_crisis_alerts(
    db: Session,
    escalation: Escalation,
    student: User,
    message: ChatMessage,
) -> None:
    label = _student_label(student)
    level = escalation.level.value
    excerpt = message.content[:300]
    dashboard_link = f"{settings.frontend_url}/counselor/dashboard"

    for email in settings.counselor_emails_list:
        await send_crisis_alert_email(
            to_email=email,
            student_label=label,
            distress_level=level,
            message_excerpt=excerpt,
            escalation_id=str(escalation.id),
            dashboard_link=dashboard_link,
        )

    counselors = (
        db.query(User)
        .filter(User.role.in_([UserRole.COUNSELOR, UserRole.ADMIN]), User.is_active.is_(True))
        .all()
    )
    for counselor in counselors:
        create_crisis_notification(
            db,
            counselor=counselor,
            escalation=escalation,
            student_label=label,
            distress_level=level,
        )
