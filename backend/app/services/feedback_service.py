from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Feedback, User
from app.models.enums import UserRole
from app.services.wellness_service import block_guest


def _student_label(user: User) -> str:
    if user.nickname:
        return user.nickname
    if user.email and not user.is_anonymous:
        return user.email
    return "Anonymous student" if user.is_anonymous else "Student"


def feedback_to_dict(entry: Feedback, student: User | None = None) -> dict:
    return {
        "id": str(entry.id),
        "user_id": str(entry.user_id),
        "rating": entry.rating,
        "comment": entry.comment,
        "created_at": entry.created_at.isoformat(),
        "student_label": _student_label(student) if student else None,
    }


def create_feedback(
    db: Session,
    user: User,
    *,
    rating: int | None,
    comment: str | None,
) -> Feedback:
    block_guest(user)
    entry = Feedback(
        user_id=user.id,
        rating=rating,
        comment=comment.strip() if comment else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_own_feedback(db: Session, user: User, limit: int = 20) -> list[Feedback]:
    block_guest(user)
    return (
        db.query(Feedback)
        .filter(Feedback.user_id == user.id)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .all()
    )


def list_all_feedback(db: Session, limit: int = 50) -> list[tuple[Feedback, User]]:
    return (
        db.query(Feedback, User)
        .join(User, Feedback.user_id == User.id)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .all()
    )


def require_staff(user: User) -> None:
    if user.role not in (UserRole.COUNSELOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
