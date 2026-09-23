from pydantic import BaseModel

from app.schemas.assessment import AssessmentResultResponse, TrendPoint
from app.schemas.wellness import DailyCheckinResponse, MoodTrendPoint


class DashboardStats(BaseModel):
    assessments_completed: int
    mood_entries_count: int
    checkins_count: int
    chat_sessions_count: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    latest_assessments: dict[str, AssessmentResultResponse | None]
    assessment_trends: dict[str, list[TrendPoint]]
    mood_trend: list[MoodTrendPoint]
    latest_mood: MoodTrendPoint | None
    mood_logged_today: bool = False
    checkin_logged_today: bool = False
    latest_checkin: DailyCheckinResponse | None
    wellness_tip: str
    is_guest: bool
