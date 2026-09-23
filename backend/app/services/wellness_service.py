from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import DailyCheckin, MoodEntry, User
from app.schemas.wellness import MOOD_LABELS

# Campus timezone for "once per day" wellness limits
APP_TZ = ZoneInfo("Africa/Kampala")


def _mood_label(score: int) -> str:
    return MOOD_LABELS.get(score, "Unknown")


def _today_bounds_utc(now: datetime | None = None) -> tuple[datetime, datetime]:
    """Return [start, end) of the current local calendar day in UTC."""
    local_now = (now or datetime.now(timezone.utc)).astimezone(APP_TZ)
    start_local = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def mood_to_dict(entry: MoodEntry) -> dict:
    return {
        "id": str(entry.id),
        "mood_score": entry.mood_score,
        "mood_label": entry.mood_label or _mood_label(entry.mood_score),
        "notes": entry.notes,
        "created_at": entry.created_at.isoformat(),
    }


def checkin_to_dict(entry: DailyCheckin) -> dict:
    return {
        "id": str(entry.id),
        "energy_level": entry.energy_level,
        "stress_level": entry.stress_level,
        "sleep_quality": entry.sleep_quality,
        "notes": entry.notes,
        "created_at": entry.created_at.isoformat(),
    }


def get_todays_mood(db: Session, user: User) -> MoodEntry | None:
    start, end = _today_bounds_utc()
    return (
        db.query(MoodEntry)
        .filter(
            MoodEntry.user_id == user.id,
            MoodEntry.created_at >= start,
            MoodEntry.created_at < end,
        )
        .order_by(MoodEntry.created_at.desc())
        .first()
    )


def log_mood(db: Session, user: User, mood_score: int, notes: str | None = None) -> MoodEntry:
    existing = get_todays_mood(db, user)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already logged your mood for today. Try again tomorrow.",
        )

    entry = MoodEntry(
        user_id=user.id,
        mood_score=mood_score,
        mood_label=_mood_label(mood_score),
        notes=notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_mood_history(db: Session, user: User, limit: int = 30) -> list[MoodEntry]:
    return (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user.id)
        .order_by(MoodEntry.created_at.desc())
        .limit(limit)
        .all()
    )


def get_mood_trend(db: Session, user: User, days: int = 14) -> list[dict]:
    """Build a Kampala-local daily mood series for the last `days` calendar days.

    One point per day (latest entry wins). Days without a log are included with
    null scores so the chart timeline always includes today.
    """
    local_today = datetime.now(timezone.utc).astimezone(APP_TZ).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    window_start_local = local_today - timedelta(days=days - 1)
    window_start_utc = window_start_local.astimezone(timezone.utc)

    entries = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user.id, MoodEntry.created_at >= window_start_utc)
        .order_by(MoodEntry.created_at.asc())
        .all()
    )

    by_date: dict[str, dict] = {}
    for entry in entries:
        day = entry.created_at.astimezone(APP_TZ).strftime("%Y-%m-%d")
        by_date[day] = {
            "date": day,
            "mood_score": entry.mood_score,
            "mood_label": entry.mood_label or _mood_label(entry.mood_score),
        }

    points: list[dict] = []
    for offset in range(days):
        day = (window_start_local + timedelta(days=offset)).strftime("%Y-%m-%d")
        points.append(
            by_date.get(
                day,
                {"date": day, "mood_score": None, "mood_label": None},
            )
        )
    return points


def get_todays_checkin(db: Session, user: User) -> DailyCheckin | None:
    start, end = _today_bounds_utc()
    return (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.user_id == user.id,
            DailyCheckin.created_at >= start,
            DailyCheckin.created_at < end,
        )
        .order_by(DailyCheckin.created_at.desc())
        .first()
    )


def log_checkin(
    db: Session,
    user: User,
    *,
    energy_level: int,
    stress_level: int,
    sleep_quality: int | None = None,
    notes: str | None = None,
) -> DailyCheckin:
    existing = get_todays_checkin(db, user)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already completed your check-in for today. Try again tomorrow.",
        )

    entry = DailyCheckin(
        user_id=user.id,
        energy_level=energy_level,
        stress_level=stress_level,
        sleep_quality=sleep_quality,
        notes=notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_latest_checkin(db: Session, user: User) -> DailyCheckin | None:
    return (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user.id)
        .order_by(DailyCheckin.created_at.desc())
        .first()
    )


def get_checkin_history(db: Session, user: User, limit: int = 14) -> list[DailyCheckin]:
    return (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user.id)
        .order_by(DailyCheckin.created_at.desc())
        .limit(limit)
        .all()
    )


def count_mood_entries(db: Session, user: User) -> int:
    return db.query(MoodEntry).filter(MoodEntry.user_id == user.id).count()


def count_checkins(db: Session, user: User) -> int:
    return db.query(DailyCheckin).filter(DailyCheckin.user_id == user.id).count()


def block_guest(user: User) -> None:
    from app.models.enums import UserRole

    if user.role == UserRole.GUEST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest users cannot save wellness data. Please register for full access.",
        )
