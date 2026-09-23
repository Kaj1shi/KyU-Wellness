from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Assessment, ChatSession, DailyCheckin, Escalation, MoodEntry, User
from app.models.enums import EscalationStatus, SeverityLevel, UserRole
from app.services import assessment_service, escalation_service, notification_service


def _student_summary(user: User) -> dict:
    return {
        "id": str(user.id),
        "nickname": user.nickname,
        "email": None if user.is_anonymous else user.email,
        "faculty": user.faculty,
        "year_of_study": user.year_of_study,
        "is_anonymous": user.is_anonymous,
    }


def build_counselor_dashboard(db: Session, counselor: User) -> dict:
    students = (
        db.query(User)
        .filter(User.role == UserRole.STUDENT, User.is_active.is_(True))
        .count()
    )
    guests = (
        db.query(User)
        .filter(User.role == UserRole.GUEST, User.is_active.is_(True))
        .count()
    )
    open_count = (
        db.query(Escalation)
        .filter(Escalation.status == EscalationStatus.OPEN)
        .count()
    )
    ack_count = (
        db.query(Escalation)
        .filter(Escalation.status == EscalationStatus.ACKNOWLEDGED)
        .count()
    )
    resolved_count = (
        db.query(Escalation)
        .filter(Escalation.status == EscalationStatus.RESOLVED)
        .count()
    )
    total_assessments = db.query(Assessment).count()
    high_assessments = (
        db.query(Assessment)
        .filter(Assessment.severity == SeverityLevel.HIGH)
        .count()
    )

    recent_rows = escalation_service.list_escalations(db, limit=5)
    recent = [
        escalation_service.escalation_to_dict(esc, student)
        for esc, student in recent_rows
    ]

    since = datetime.now(timezone.utc) - timedelta(days=14)
    trend_rows = (
        db.query(
            func.date(Escalation.created_at).label("day"),
            func.count(Escalation.id).label("cnt"),
        )
        .filter(Escalation.created_at >= since)
        .group_by(func.date(Escalation.created_at))
        .order_by(func.date(Escalation.created_at))
        .all()
    )
    escalation_trend = [{"date": str(row.day), "count": row.cnt} for row in trend_rows]

    distress_breakdown = {"low": 0, "moderate": 0, "high": 0, "crisis": 0}
    level_rows = (
        db.query(Escalation.level, func.count(Escalation.id))
        .group_by(Escalation.level)
        .all()
    )
    for level, count in level_rows:
        distress_breakdown[level.value] = count

    assessment_severity = {"low": 0, "moderate": 0, "high": 0}
    sev_rows = (
        db.query(Assessment.severity, func.count(Assessment.id))
        .group_by(Assessment.severity)
        .all()
    )
    for severity, count in sev_rows:
        assessment_severity[severity.value] = count

    return {
        "stats": {
            "total_students": students,
            "active_students": students,
            "guest_sessions": guests,
            "open_escalations": open_count,
            "acknowledged_escalations": ack_count,
            "resolved_escalations": resolved_count,
            "total_assessments": total_assessments,
            "high_severity_assessments": high_assessments,
            "unread_notifications": notification_service.unread_count(db, counselor),
        },
        "recent_escalations": recent,
        "escalation_trend": escalation_trend,
        "distress_breakdown": distress_breakdown,
        "assessment_severity": assessment_severity,
    }


def list_student_caseload(db: Session, limit: int = 50) -> list[dict]:
    """Students with escalations or assessments, prioritized by open escalations."""
    student_ids_with_activity: set[UUID] = set()

    for (uid,) in db.query(Escalation.user_id).distinct().all():
        student_ids_with_activity.add(uid)

    for (uid,) in (
        db.query(Assessment.user_id)
        .filter(Assessment.severity == SeverityLevel.HIGH)
        .distinct()
        .all()
    ):
        student_ids_with_activity.add(uid)

    if student_ids_with_activity:
        users = (
            db.query(User)
            .filter(User.id.in_(student_ids_with_activity))
            .order_by(User.created_at.desc())
            .limit(limit)
            .all()
        )
    else:
        users = (
            db.query(User)
            .filter(User.role.in_([UserRole.STUDENT, UserRole.GUEST]), User.is_active.is_(True))
            .order_by(User.created_at.desc())
            .limit(limit)
            .all()
        )

    items = []
    for user in users:
        esc_count = db.query(Escalation).filter(Escalation.user_id == user.id).count()
        open_count = (
            db.query(Escalation)
            .filter(
                Escalation.user_id == user.id,
                Escalation.status == EscalationStatus.OPEN,
            )
            .count()
        )
        latest_esc = (
            db.query(Escalation)
            .filter(Escalation.user_id == user.id)
            .order_by(Escalation.created_at.desc())
            .first()
        )
        latest_assessment = (
            db.query(Assessment)
            .filter(Assessment.user_id == user.id)
            .order_by(Assessment.completed_at.desc())
            .first()
        )
        items.append(
            {
                "id": str(user.id),
                "nickname": user.nickname,
                "email": user.email if not user.is_anonymous else None,
                "faculty": user.faculty,
                "year_of_study": user.year_of_study,
                "is_anonymous": user.is_anonymous,
                "escalation_count": esc_count,
                "open_escalations": open_count,
                "latest_escalation_at": latest_esc.created_at.isoformat()
                if latest_esc
                else None,
                "latest_assessment_severity": latest_assessment.severity.value
                if latest_assessment
                else None,
            }
        )

    items.sort(
        key=lambda x: (x["open_escalations"], x["escalation_count"]),
        reverse=True,
    )
    return items


def get_student_detail(db: Session, student_id: UUID) -> dict:
    """Return caseload detail for a user profile counselors may open from alerts.

    Allows student/guest accounts and any account that has escalations (e.g. a
    counselor account used during testing), so crisis alert deep-links do not 400.
    """
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    has_escalation = (
        db.query(Escalation.id).filter(Escalation.user_id == user.id).first() is not None
    )
    if user.role not in (UserRole.STUDENT, UserRole.GUEST) and not has_escalation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a student or guest account",
        )

    assessments = assessment_service.get_user_assessments(db, user, limit=20)
    assessment_summaries = [
        {
            "assessment_type": a.assessment_type.value,
            "title": assessment_service.get_definition(a.assessment_type)["title"],
            "score": a.score,
            "max_score": assessment_service.get_definition(a.assessment_type)["max_score"],
            "severity": a.severity.value,
            "completed_at": a.completed_at.isoformat(),
        }
        for a in assessments
    ]

    esc_rows = (
        db.query(Escalation)
        .filter(Escalation.user_id == user.id)
        .order_by(Escalation.created_at.desc())
        .limit(20)
        .all()
    )
    escalations = [escalation_service.escalation_to_dict(e, user) for e in esc_rows]

    mood_count = db.query(MoodEntry).filter(MoodEntry.user_id == user.id).count()
    checkin_count = db.query(DailyCheckin).filter(DailyCheckin.user_id == user.id).count()
    chat_count = db.query(ChatSession).filter(ChatSession.user_id == user.id).count()

    return {
        "student": _student_summary(user),
        "assessments": assessment_summaries,
        "escalations": escalations,
        "mood_entries_count": mood_count,
        "checkins_count": checkin_count,
        "chat_sessions_count": chat_count,
    }
