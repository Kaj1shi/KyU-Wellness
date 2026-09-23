from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import settings
from app.middleware.auth import get_current_user, require_roles
from app.models import User
from app.models.enums import UserRole
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentResponse,
    AppointmentUpdateRequest,
)
from app.services import appointment_service
from app.services.email_service import send_email

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = appointment_service.create_appointment(
        db,
        current_user,
        preferred_date=data.preferred_date,
        reason=data.reason,
    )
    label = current_user.nickname or current_user.email or "Student"
    link = f"{settings.frontend_url}/counselor/appointments"
    body = (
        "New counseling appointment request — KyU Wellness\n\n"
        f"Student: {label}\n"
        f"Preferred date: {entry.preferred_date or 'Not specified'}\n"
        f"Reason: {entry.reason or 'Not specified'}\n\n"
        f"Review requests:\n{link}\n"
    )
    for email in settings.counselor_emails_list:
        await send_email(email, "[Appointment] New counseling request", body)

    return AppointmentResponse(
        **appointment_service.appointment_to_dict(entry, current_user)
    )


@router.get("/mine", response_model=list[AppointmentResponse])
def list_my_appointments(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = appointment_service.list_own_appointments(db, current_user, limit=limit)
    return [
        AppointmentResponse(**appointment_service.appointment_to_dict(e, current_user))
        for e in entries
    ]


@router.get("", response_model=list[AppointmentResponse])
def list_appointments(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    rows = appointment_service.list_all_appointments(
        db, status_filter=status_filter, limit=limit
    )
    return [
        AppointmentResponse(**appointment_service.appointment_to_dict(entry, student))
        for entry, student in rows
    ]


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: UUID,
    data: AppointmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    entry, student = appointment_service.update_appointment_status(
        db, appointment_id, data.status
    )
    return AppointmentResponse(**appointment_service.appointment_to_dict(entry, student))
