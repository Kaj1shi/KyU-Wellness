from typing import Literal

from pydantic import BaseModel, Field

AppointmentStatus = Literal["pending", "scheduled", "completed", "cancelled"]


class AppointmentCreateRequest(BaseModel):
    preferred_date: str | None = Field(default=None, max_length=50)
    reason: str | None = Field(default=None, max_length=5000)


class AppointmentUpdateRequest(BaseModel):
    status: AppointmentStatus


class AppointmentResponse(BaseModel):
    id: str
    user_id: str
    preferred_date: str | None
    reason: str | None
    status: str
    created_at: str
    student_label: str | None = None
    student_email: str | None = None
