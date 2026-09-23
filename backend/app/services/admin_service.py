from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User
from app.models.enums import UserRole

ASSIGNABLE = {
    "student": UserRole.STUDENT,
    "counselor": UserRole.COUNSELOR,
    "admin": UserRole.ADMIN,
}


def set_user_role(db: Session, email: str, role: str) -> User:
    mapped = ASSIGNABLE.get(role)
    if mapped is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be student, counselor, or admin",
        )

    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_anonymous or user.role == UserRole.GUEST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change role for guest/anonymous accounts",
        )

    user.role = mapped
    db.commit()
    db.refresh(user)
    return user
