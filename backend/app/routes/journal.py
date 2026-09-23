from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models import User
from app.schemas.journal import JournalCreateRequest, JournalEntryResponse, JournalUpdateRequest
from app.services import journal_service

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=list[JournalEntryResponse])
def list_journal(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = journal_service.list_entries(db, current_user, limit=limit)
    return [JournalEntryResponse(**journal_service.journal_to_dict(e)) for e in entries]


@router.post("", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
def create_journal(
    data: JournalCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = journal_service.create_entry(
        db, current_user, title=data.title, content=data.content
    )
    return JournalEntryResponse(**journal_service.journal_to_dict(entry))


@router.get("/{entry_id}", response_model=JournalEntryResponse)
def get_journal(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = journal_service.get_entry(db, current_user, entry_id)
    return JournalEntryResponse(**journal_service.journal_to_dict(entry))


@router.patch("/{entry_id}", response_model=JournalEntryResponse)
def update_journal(
    entry_id: UUID,
    data: JournalUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = journal_service.update_entry(
        db,
        current_user,
        entry_id,
        title=data.title,
        content=data.content,
    )
    return JournalEntryResponse(**journal_service.journal_to_dict(entry))


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journal_service.delete_entry(db, current_user, entry_id)
    return None
