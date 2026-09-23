from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ChatMessage, ChatSession, DistressResult, User
from app.models.enums import MessageSender
from app.services import distress_service, escalation_service
from app.services.openai_chat_service import OpenAIChatError, generate_assistant_reply


def create_session(db: Session, user: User, title: str | None = None) -> ChatSession:
    session = ChatSession(user_id=user.id, title=title, is_active=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_sessions(db: Session, user: User, limit: int = 50) -> list[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
        .all()
    )


def get_session_for_user(db: Session, user: User, session_id: UUID) -> ChatSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def rename_session(db: Session, user: User, session_id: UUID, title: str) -> ChatSession:
    session = get_session_for_user(db, user, session_id)
    cleaned = title.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be empty",
        )
    session.title = cleaned[:255]
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, user: User, session_id: UUID) -> None:
    """Delete a chat session.

    Uses a SQL DELETE so Postgres ON DELETE CASCADE removes messages and
    distress rows. ORM unit-of-work deletes fail when distress_results exist
    because message_id is NOT NULL and had no ORM cascade.
    """
    session = get_session_for_user(db, user, session_id)
    deleted = (
        db.query(ChatSession)
        .filter(ChatSession.id == session.id, ChatSession.user_id == user.id)
        .delete(synchronize_session=False)
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    db.commit()


def get_session_messages(db: Session, session: ChatSession, limit: int = 100) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )


def _message_to_history_item(msg: ChatMessage) -> dict[str, str]:
    role = "assistant" if msg.sender.value == MessageSender.ASSISTANT.value else "user"
    if msg.sender.value == MessageSender.SYSTEM.value:
        role = "system"
    return {"role": role, "content": msg.content}


def _distress_flags(record: DistressResult | None) -> tuple[str | None, bool | None]:
    if not record:
        return None, None
    level = record.level.value
    ai_analysis = record.ai_analysis or {}
    rule_matches = record.rule_matches or {}
    requires = (
        level == "crisis"
        or bool(ai_analysis.get("requires_escalation"))
        or bool(rule_matches.get("is_crisis_rule"))
    )
    return level, requires


async def send_message(
    db: Session,
    user: User,
    session_id: UUID,
    content: str,
    *,
    use_ai_distress: bool = True,
) -> dict:
    session = get_session_for_user(db, user, session_id)

    user_msg = ChatMessage(session_id=session.id, sender=MessageSender.USER, content=content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    distress_record = await distress_service.analyze_and_persist(
        db, user_msg.id, user_msg.content, use_ai=use_ai_distress
    )
    distress_level, requires_escalation = _distress_flags(distress_record)

    escalation = await escalation_service.maybe_escalate(
        db,
        user,
        user_msg,
        distress_record,
        requires_escalation=bool(requires_escalation),
    )

    history_msgs = get_session_messages(db, session, limit=30)
    history = [_message_to_history_item(m) for m in history_msgs if m.sender != MessageSender.SYSTEM]

    try:
        ai = await generate_assistant_reply(history=history, distress_level=distress_level)
    except OpenAIChatError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    assistant_text = ai["content"]
    if requires_escalation:
        assistant_text = (
            assistant_text
            + "\n\nIf you feel you might harm yourself or are in immediate danger, please seek help now: "
            "contact a trusted person, campus counseling services, or local emergency services."
        )

    assistant_msg = ChatMessage(
        session_id=session.id,
        sender=MessageSender.ASSISTANT,
        content=assistant_text,
        metadata_={"model": ai.get("model"), "tokens_used": ai.get("tokens_used")},
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    # Ensure session ordering reflects latest activity
    db.refresh(session)

    return {
        "session": session,
        "user_message": user_msg,
        "assistant_message": assistant_msg,
        "distress_level": distress_level,
        "requires_escalation": requires_escalation,
        "escalation_triggered": escalation is not None,
        "escalation_id": str(escalation.id) if escalation else None,
        "model": ai.get("model"),
        "tokens_used": ai.get("tokens_used"),
    }

