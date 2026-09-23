from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models import User
from app.schemas.wellness import (
    DailyCheckinRequest,
    DailyCheckinResponse,
    LogMoodRequest,
    MoodEntryResponse,
)
from app.services import wellness_service

router = APIRouter(prefix="/wellness", tags=["wellness"])


@router.post("/mood", response_model=MoodEntryResponse, status_code=status.HTTP_201_CREATED)
def log_mood(
    data: LogMoodRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wellness_service.block_guest(current_user)
    entry = wellness_service.log_mood(db, current_user, data.mood_score, data.notes)
    return MoodEntryResponse(**wellness_service.mood_to_dict(entry))


@router.get("/mood", response_model=list[MoodEntryResponse])
def list_mood(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wellness_service.block_guest(current_user)
    entries = wellness_service.get_mood_history(db, current_user, limit=limit)
    return [MoodEntryResponse(**wellness_service.mood_to_dict(e)) for e in entries]


@router.post("/checkin", response_model=DailyCheckinResponse, status_code=status.HTTP_201_CREATED)
def log_checkin(
    data: DailyCheckinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wellness_service.block_guest(current_user)
    entry = wellness_service.log_checkin(
        db,
        current_user,
        energy_level=data.energy_level,
        stress_level=data.stress_level,
        sleep_quality=data.sleep_quality,
        notes=data.notes,
    )
    return DailyCheckinResponse(**wellness_service.checkin_to_dict(entry))


@router.get("/checkin", response_model=list[DailyCheckinResponse])
def list_checkins(
    limit: int = Query(60, ge=1, le=180),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wellness_service.block_guest(current_user)
    entries = wellness_service.get_checkin_history(db, current_user, limit=limit)
    return [DailyCheckinResponse(**wellness_service.checkin_to_dict(e)) for e in entries]
