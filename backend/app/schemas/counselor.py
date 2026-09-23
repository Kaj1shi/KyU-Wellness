from pydantic import BaseModel

from app.schemas.escalation import EscalationStudentSummary


class CounselorStats(BaseModel):
    total_students: int
    active_students: int
    guest_sessions: int
    open_escalations: int
    acknowledged_escalations: int
    resolved_escalations: int
    total_assessments: int
    high_severity_assessments: int
    unread_notifications: int


class EscalationTrendPoint(BaseModel):
    date: str
    count: int


class SeverityBreakdown(BaseModel):
    low: int
    moderate: int
    high: int
    crisis: int


class CounselorDashboardResponse(BaseModel):
    stats: CounselorStats
    recent_escalations: list[dict]
    escalation_trend: list[EscalationTrendPoint]
    distress_breakdown: SeverityBreakdown
    assessment_severity: dict[str, int]


class StudentCaseloadItem(BaseModel):
    id: str
    nickname: str | None
    email: str | None
    faculty: str | None
    year_of_study: int | None
    is_anonymous: bool
    escalation_count: int
    open_escalations: int
    latest_escalation_at: str | None
    latest_assessment_severity: str | None


class StudentAssessmentSummary(BaseModel):
    assessment_type: str
    title: str
    score: int
    max_score: int
    severity: str
    completed_at: str


class StudentDetailResponse(BaseModel):
    student: EscalationStudentSummary
    assessments: list[StudentAssessmentSummary]
    escalations: list[dict]
    mood_entries_count: int
    checkins_count: int
    chat_sessions_count: int
