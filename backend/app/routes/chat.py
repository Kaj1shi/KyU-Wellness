from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.limiter import limiter
from app.middleware.auth import get_current_user
from app.models import ChatMessage, ChatSession, DistressResult, User
from app.schemas.chat import (
    ChatMessageResponse,
    ChatSessionCreateRequest,
    ChatSessionResponse,
    ChatSessionUpdateRequest,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _session_to_response(s: ChatSession) -> ChatSessionResponse:
    return ChatSessionResponse(
        id=str(s.id),
        title=s.title,
        is_active=s.is_active,
        created_at=s.created_at.isoformat(),
        updated_at=s.updated_at.isoformat(),
    )


def _message_to_response(db: Session, m: ChatMessage) -> ChatMessageResponse:
    record = db.query(DistressResult).filter(DistressResult.message_id == m.id).first()
    distress_level = record.level.value if record else None
    requires = None
    if record:
        ai_analysis = record.ai_analysis or {}
        rule_matches = record.rule_matches or {}
        requires = (
            distress_level == "crisis"
            or bool(ai_analysis.get("requires_escalation"))
            or bool(rule_matches.get("is_crisis_rule"))
        )

    return ChatMessageResponse(
        id=str(m.id),
        session_id=str(m.session_id),
        sender=m.sender.value,
        content=m.content,
        created_at=m.created_at.isoformat(),
        distress_level=distress_level,
        requires_escalation=requires,
    )


@router.get("/sessions", response_model=list[ChatSessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = chat_service.get_user_sessions(db, current_user, limit=50)
    return [_session_to_response(s) for s in sessions]


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    data: ChatSessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = chat_service.create_session(db, current_user, title=data.title)
    return _session_to_response(s)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
def rename_session(
    session_id: UUID,
    data: ChatSessionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = chat_service.rename_session(db, current_user, session_id, title=data.title)
    return _session_to_response(s)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat_service.delete_session(db, current_user, session_id)
    return None


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def list_messages(
    session_id: UUID,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = chat_service.get_session_for_user(db, current_user, session_id)
    msgs = chat_service.get_session_messages(db, session, limit=limit)
    return [_message_to_response(db, m) for m in msgs]


@router.post(
    "/sessions/{session_id}/messages",
    response_model=SendMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("30/minute")
async def send_message(
    request: Request,
    session_id: UUID,
    data: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await chat_service.send_message(
        db, current_user, session_id, data.content, use_ai_distress=data.use_ai_distress
    )
    return SendMessageResponse(
        session=_session_to_response(res["session"]),
        user_message=_message_to_response(db, res["user_message"]),
        assistant_message=_message_to_response(db, res["assistant_message"]),
        model=res.get("model"),
        tokens_used=res.get("tokens_used"),
        escalation_triggered=res.get("escalation_triggered", False),
        escalation_id=res.get("escalation_id"),
    )

