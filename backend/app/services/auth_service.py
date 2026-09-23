import uuid

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User
from app.models.enums import UserRole
from app.schemas.auth import RegisterRequest, UserResponse
from app.services.email_service import send_verification_email
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.utils.tokens import create_email_token


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        is_anonymous=user.is_anonymous,
        email_verified=user.email_verified,
        age=user.age,
        gender=user.gender,
        faculty=user.faculty,
        year_of_study=user.year_of_study,
        nickname=user.nickname,
    )


def create_tokens_for_user(user: User) -> dict[str, str]:
    claims = {"role": user.role.value, "is_anonymous": user.is_anonymous}
    return {
        "access_token": create_access_token(str(user.id), claims),
        "refresh_token": create_refresh_token(str(user.id)),
        "token_type": "bearer",
    }


async def register_user(db: Session, data: RegisterRequest) -> tuple[User, dict[str, str]]:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.STUDENT,
        is_anonymous=False,
        email_verified=False,
        privacy_consent=data.privacy_consent,
        age=data.age,
        gender=data.gender,
        faculty=data.faculty,
        year_of_study=data.year_of_study,
        nickname=data.nickname,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_record = create_email_token(db, user, "email_verification", expires_hours=24)
    await send_verification_email(user.email, token_record.token)

    return user, create_tokens_for_user(user)


def login_user(db: Session, email: str, password: str) -> tuple[User, dict[str, str]]:
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return user, create_tokens_for_user(user)


def create_guest_user(db: Session, nickname: str | None = None) -> tuple[User, dict[str, str]]:
    user = User(
        email=None,
        password_hash=None,
        role=UserRole.GUEST,
        is_anonymous=True,
        email_verified=False,
        privacy_consent=True,
        nickname=nickname or f"Guest-{uuid.uuid4().hex[:6]}",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user, create_tokens_for_user(user)


def refresh_access_token(db: Session, refresh_token: str) -> dict[str, str]:
    from jose import JWTError

    from app.utils.security import decode_token, verify_token_type

    try:
        payload = decode_token(refresh_token)
        if not verify_token_type(payload, "refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == UUID(user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return create_tokens_for_user(user)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


async def request_password_reset(db: Session, email: str) -> None:
    from app.services.email_service import send_password_reset_email

    user = db.query(User).filter(User.email == email).first()
    if not user or user.is_anonymous:
        return

    token_record = create_email_token(db, user, "password_reset", expires_hours=1)
    await send_password_reset_email(user.email, token_record.token)


def reset_password(db: Session, token: str, new_password: str) -> None:
    from app.utils.tokens import get_valid_token, mark_token_used

    record = get_valid_token(db, token, "password_reset")
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    user.password_hash = hash_password(new_password)
    mark_token_used(db, record)
    db.commit()


def verify_email(db: Session, token: str) -> User:
    from app.utils.tokens import get_valid_token, mark_token_used

    record = get_valid_token(db, token, "email_verification")
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    user.email_verified = True
    mark_token_used(db, record)
    db.commit()
    db.refresh(user)
    return user
