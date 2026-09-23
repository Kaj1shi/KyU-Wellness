from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import JournalEntry, User
from app.models.enums import UserRole
from app.services.wellness_service import block_guest


def journal_to_dict(entry: JournalEntry) -> dict:
    return {
        "id": str(entry.id),
        "title": entry.title,
        "content": entry.content,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
    }


def list_entries(db: Session, user: User, limit: int = 50) -> list[JournalEntry]:
    block_guest(user)
    return (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id)
        .order_by(JournalEntry.updated_at.desc())
        .limit(limit)
        .all()
    )


def get_entry(db: Session, user: User, entry_id: UUID) -> JournalEntry:
    block_guest(user)
    entry = (
        db.query(JournalEntry)
        .filter(JournalEntry.id == entry_id, JournalEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    return entry


def create_entry(
    db: Session,
    user: User,
    *,
    title: str | None,
    content: str,
) -> JournalEntry:
    block_guest(user)
    if user.role == UserRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot journal")
    entry = JournalEntry(user_id=user.id, title=title, content=content.strip())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_entry(
    db: Session,
    user: User,
    entry_id: UUID,
    *,
    title: str | None = None,
    content: str | None = None,
) -> JournalEntry:
    entry = get_entry(db, user, entry_id)
    if title is not None:
        entry.title = title
    if content is not None:
        entry.content = content.strip()
    db.commit()
    db.refresh(entry)
    return entry


def delete_entry(db: Session, user: User, entry_id: UUID) -> None:
    entry = get_entry(db, user, entry_id)
    db.delete(entry)
    db.commit()
