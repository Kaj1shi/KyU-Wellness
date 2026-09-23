from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import AssessmentType


class QuestionOption(BaseModel):
    value: int
    label: str


class Question(BaseModel):
    id: str
    text: str


class AssessmentQuestionsResponse(BaseModel):
    assessment_type: str
    title: str
    description: str
    instructions: str
    options: list[QuestionOption]
    questions: list[Question]
    max_score: int


class SubmitAssessmentRequest(BaseModel):
    assessment_type: AssessmentType
    responses: dict[str, int] = Field(..., description="Map of question id to score value")


class AssessmentResultResponse(BaseModel):
    id: str
    assessment_type: str
    title: str
    score: int
    max_score: int
    severity: str
    severity_label: str
    wellness_tips: list[str]
    completed_at: str


class AssessmentHistoryItem(BaseModel):
    id: str
    assessment_type: str
    title: str
    score: int
    max_score: int
    severity: str
    completed_at: str


class AssessmentSummaryResponse(BaseModel):
    latest: dict[str, AssessmentResultResponse | None]
    history_count: int


class TrendPoint(BaseModel):
    date: str
    score: int
    severity: str


class AssessmentTrendsResponse(BaseModel):
    phq9: list[TrendPoint]
    gad7: list[TrendPoint]
    stress: list[TrendPoint]
