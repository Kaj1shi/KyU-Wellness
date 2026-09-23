from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import EmailToken, User
from app.utils.security import generate_secure_token


def create_email_token(
    db: Session,
    user: User,
    token_type: str,
    expires_hours: int = 24,
) -> EmailToken:
    token = EmailToken(
        user_id=user.id,
        token=generate_secure_token(),
        token_type=token_type,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=expires_hours),
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def get_valid_token(db: Session, token: str, token_type: str) -> EmailToken | None:
    record = (
        db.query(EmailToken)
        .filter(
            EmailToken.token == token,
            EmailToken.token_type == token_type,
            EmailToken.used.is_(False),
        )
        .first()
    )
    if not record:
        return None

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        return None

    return record


def mark_token_used(db: Session, record: EmailToken) -> None:
    record.used = True
    db.commit()
