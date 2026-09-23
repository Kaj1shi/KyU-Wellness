import random

from sqlalchemy.orm import Session

from app.models import ChatSession, User
from app.models.enums import AssessmentType, UserRole
from app.services import assessment_service, wellness_service


GENERAL_WELLNESS_TIPS = [
    "Take a short walk between study sessions to reset your mind.",
    "Reach out to a friend or counselor when stress feels heavy.",
    "Practice 5 minutes of deep breathing before exams.",
    "Keep a consistent sleep schedule — rest supports emotional resilience.",
    "Celebrate small wins; progress matters more than perfection.",
]


def _build_assessment_trends(db: Session, user: User) -> dict[str, list[dict]]:
    trends: dict[str, list[dict]] = {}
    for atype in AssessmentType:
        records = assessment_service.get_user_assessments(db, user, atype, limit=10)
        records = sorted(records, key=lambda r: r.completed_at)
        trends[atype.value] = [
            {
                "date": r.completed_at.strftime("%Y-%m-%d"),
                "score": r.score,
                "severity": r.severity.value,
            }
            for r in records
        ]
    return trends


def build_dashboard(db: Session, user: User) -> dict:
    is_guest = user.role == UserRole.GUEST

    chat_count = (
        db.query(ChatSession).filter(ChatSession.user_id == user.id).count()
        if user
        else 0
    )

    if is_guest:
        return {
            "stats": {
                "assessments_completed": 0,
                "mood_entries_count": 0,
                "checkins_count": 0,
                "chat_sessions_count": chat_count,
            },
            "latest_assessments": {t.value: None for t in AssessmentType},
            "assessment_trends": {t.value: [] for t in AssessmentType},
            "mood_trend": [],
            "latest_mood": None,
            "mood_logged_today": False,
            "checkin_logged_today": False,
            "latest_checkin": None,
            "wellness_tip": random.choice(GENERAL_WELLNESS_TIPS),
            "is_guest": True,
        }

    latest = assessment_service.get_latest_by_type(db, user)
    latest_response: dict[str, dict | None] = {}
    for atype in AssessmentType:
        record = latest.get(atype)
        latest_response[atype.value] = (
            assessment_service.assessment_to_summary(record) if record else None
        )

    history = assessment_service.get_user_assessments(db, user, limit=100)
    mood_trend = wellness_service.get_mood_trend(db, user, days=14)
    todays_mood = wellness_service.get_todays_mood(db, user)
    latest_mood = None
    if todays_mood:
        latest_mood = {
            "date": todays_mood.created_at.astimezone(wellness_service.APP_TZ).strftime(
                "%Y-%m-%d"
            ),
            "mood_score": todays_mood.mood_score,
            "mood_label": todays_mood.mood_label
            or wellness_service._mood_label(todays_mood.mood_score),
        }
    else:
        latest_mood = next(
            (point for point in reversed(mood_trend) if point.get("mood_score") is not None),
            None,
        )
    todays_checkin = wellness_service.get_todays_checkin(db, user)
    latest_checkin = todays_checkin or wellness_service.get_latest_checkin(db, user)

    tip = random.choice(GENERAL_WELLNESS_TIPS)
    for atype in AssessmentType:
        record = latest.get(atype)
        if record:
            tips = assessment_service.get_wellness_tips(record.assessment_type, record.severity)
            if tips:
                tip = tips[0]
                break

    return {
        "stats": {
            "assessments_completed": len(history),
            "mood_entries_count": wellness_service.count_mood_entries(db, user),
            "checkins_count": wellness_service.count_checkins(db, user),
            "chat_sessions_count": chat_count,
        },
        "latest_assessments": latest_response,
        "assessment_trends": _build_assessment_trends(db, user),
        "mood_trend": mood_trend,
        "latest_mood": latest_mood,
        "mood_logged_today": todays_mood is not None,
        "checkin_logged_today": todays_checkin is not None,
        "latest_checkin": wellness_service.checkin_to_dict(latest_checkin)
        if latest_checkin
        else None,
        "wellness_tip": tip,
        "is_guest": False,
    }
