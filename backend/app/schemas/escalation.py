from typing import Literal

from pydantic import BaseModel, Field


class EscalationStudentSummary(BaseModel):
    id: str
    nickname: str | None
    email: str | None
    faculty: str | None
    year_of_study: int | None
    is_anonymous: bool


class EscalationResponse(BaseModel):
    id: str
    user_id: str
    message_id: str | None
    level: str
    status: str
    distress_snapshot: dict | None
    counselor_notes: str | None
    created_at: str
    resolved_at: str | None
    student: EscalationStudentSummary | None = None


class UpdateEscalationRequest(BaseModel):
    status: Literal["acknowledged", "resolved"] | None = None
    counselor_notes: str | None = Field(default=None, max_length=2000)
