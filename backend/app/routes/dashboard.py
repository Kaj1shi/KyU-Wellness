from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models import User
from app.schemas.assessment import AssessmentResultResponse, TrendPoint
from app.schemas.dashboard import DashboardResponse, DashboardStats
from app.schemas.wellness import DailyCheckinResponse, MoodTrendPoint
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = dashboard_service.build_dashboard(db, current_user)

    latest = {
        k: AssessmentResultResponse(**v) if v else None
        for k, v in data["latest_assessments"].items()
    }
    trends = {
        k: [TrendPoint(**p) for p in v] for k, v in data["assessment_trends"].items()
    }

    return DashboardResponse(
        stats=DashboardStats(**data["stats"]),
        latest_assessments=latest,
        assessment_trends=trends,
        mood_trend=[MoodTrendPoint(**p) for p in data["mood_trend"]],
        latest_mood=MoodTrendPoint(**data["latest_mood"]) if data["latest_mood"] else None,
        mood_logged_today=data.get("mood_logged_today", False),
        checkin_logged_today=data.get("checkin_logged_today", False),
        latest_checkin=DailyCheckinResponse(**data["latest_checkin"])
        if data["latest_checkin"]
        else None,
        wellness_tip=data["wellness_tip"],
        is_guest=data["is_guest"],
    )
