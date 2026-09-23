from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models import User
from app.models.enums import EscalationStatus, UserRole
from app.schemas.escalation import EscalationResponse, UpdateEscalationRequest
from app.services import escalation_service

router = APIRouter(prefix="/escalations", tags=["escalations"])


@router.get("", response_model=list[EscalationResponse])
def list_escalations(
    status_filter: EscalationStatus | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    rows = escalation_service.list_escalations(db, status=status_filter, limit=limit)
    return [
        EscalationResponse(**escalation_service.escalation_to_dict(esc, student))
        for esc, student in rows
    ]


@router.get("/{escalation_id}", response_model=EscalationResponse)
def get_escalation(
    escalation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    row = escalation_service.get_escalation(db, escalation_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation not found")
    esc, student = row
    return EscalationResponse(**escalation_service.escalation_to_dict(esc, student))


@router.patch("/{escalation_id}", response_model=EscalationResponse)
def update_escalation(
    escalation_id: UUID,
    data: UpdateEscalationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    row = escalation_service.get_escalation(db, escalation_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation not found")

    esc, student = row
    new_status = EscalationStatus(data.status) if data.status else None
    esc = escalation_service.update_escalation(
        db, esc, status=new_status, counselor_notes=data.counselor_notes
    )
    return EscalationResponse(**escalation_service.escalation_to_dict(esc, student))
