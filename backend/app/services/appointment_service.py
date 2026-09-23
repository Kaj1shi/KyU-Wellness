from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import AppointmentRequest, User
from app.models.enums import UserRole
from app.services.wellness_service import block_guest

VALID_STATUSES = {"pending", "scheduled", "completed", "cancelled"}


def _student_label(user: User) -> str:
    if user.nickname:
        return user.nickname
    if user.email and not user.is_anonymous:
        return user.email
    return "Anonymous student" if user.is_anonymous else "Student"


def appointment_to_dict(entry: AppointmentRequest, student: User | None = None) -> dict:
    return {
        "id": str(entry.id),
        "user_id": str(entry.user_id),
        "preferred_date": entry.preferred_date,
        "reason": entry.reason,
        "status": entry.status,
        "created_at": entry.created_at.isoformat(),
        "student_label": _student_label(student) if student else None,
        "student_email": (
            None
            if not student or student.is_anonymous
            else student.email
        ),
    }


def create_appointment(
    db: Session,
    user: User,
    *,
    preferred_date: str | None,
    reason: str | None,
) -> AppointmentRequest:
    block_guest(user)
    entry = AppointmentRequest(
        user_id=user.id,
        preferred_date=preferred_date,
        reason=reason.strip() if reason else None,
        status="pending",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_own_appointments(db: Session, user: User, limit: int = 50) -> list[AppointmentRequest]:
    block_guest(user)
    return (
        db.query(AppointmentRequest)
        .filter(AppointmentRequest.user_id == user.id)
        .order_by(AppointmentRequest.created_at.desc())
        .limit(limit)
        .all()
    )


def list_all_appointments(
    db: Session,
    *,
    status_filter: str | None = None,
    limit: int = 50,
) -> list[tuple[AppointmentRequest, User]]:
    q = db.query(AppointmentRequest, User).join(User, AppointmentRequest.user_id == User.id)
    if status_filter:
        if status_filter not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Use one of: {', '.join(sorted(VALID_STATUSES))}",
            )
        q = q.filter(AppointmentRequest.status == status_filter)
    return q.order_by(AppointmentRequest.created_at.desc()).limit(limit).all()


def update_appointment_status(
    db: Session,
    appointment_id: UUID,
    new_status: str,
) -> tuple[AppointmentRequest, User]:
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Use one of: {', '.join(sorted(VALID_STATUSES))}",
        )
    row = (
        db.query(AppointmentRequest, User)
        .join(User, AppointmentRequest.user_id == User.id)
        .filter(AppointmentRequest.id == appointment_id)
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment request not found",
        )
    entry, student = row
    entry.status = new_status
    db.commit()
    db.refresh(entry)
    return entry, student


def require_staff(user: User) -> None:
    if user.role not in (UserRole.COUNSELOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
