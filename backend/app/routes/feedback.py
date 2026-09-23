from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.models import User
from app.models.enums import UserRole
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse
from app.services import feedback_service

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    data: FeedbackCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = feedback_service.create_feedback(
        db, current_user, rating=data.rating, comment=data.comment
    )
    return FeedbackResponse(**feedback_service.feedback_to_dict(entry, current_user))


@router.get("/mine", response_model=list[FeedbackResponse])
def list_my_feedback(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = feedback_service.list_own_feedback(db, current_user, limit=limit)
    return [
        FeedbackResponse(**feedback_service.feedback_to_dict(e, current_user)) for e in entries
    ]


@router.get("", response_model=list[FeedbackResponse])
def list_all_feedback(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    rows = feedback_service.list_all_feedback(db, limit=limit)
    return [
        FeedbackResponse(**feedback_service.feedback_to_dict(entry, student))
        for entry, student in rows
    ]
