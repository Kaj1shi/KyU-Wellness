from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.limiter import limiter
from app.middleware.auth import get_current_user, require_roles
from app.models import ChatMessage, ChatSession, DistressResult, User
from app.models.enums import UserRole
from app.schemas.distress import AnalyzeDistressRequest, DistressAnalysisResponse
from app.services import distress_service

router = APIRouter(prefix="/distress", tags=["distress"])


def _to_response(analysis: dict, persisted_id: str | None = None) -> DistressAnalysisResponse:
    data = distress_service.analysis_to_response(analysis, persisted_id)
    return DistressAnalysisResponse(**data)


@router.post("/analyze", response_model=DistressAnalysisResponse)
@limiter.limit("30/minute")
async def analyze_distress(
    request: Request,
    data: AnalyzeDistressRequest,
    current_user: User = Depends(get_current_user),
):
    """Analyze text for distress using hybrid rule + AI detection."""
    analysis = await distress_service.analyze_text(data.text, use_ai=data.use_ai)
    return _to_response(analysis)


@router.post("/analyze/{message_id}", response_model=DistressAnalysisResponse)
@limiter.limit("30/minute")
async def analyze_message_distress(
    request: Request,
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze and persist distress result for an existing chat message."""
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    session = db.query(ChatSession).filter(ChatSession.id == message.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role not in (UserRole.COUNSELOR, UserRole.ADMIN):
        if session.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    record = await distress_service.analyze_and_persist(db, message_id, message.content)
    analysis = await distress_service.analyze_text(message.content)
    return _to_response(analysis, persisted_id=str(record.id))


@router.get("/result/{message_id}", response_model=DistressAnalysisResponse)
def get_distress_result(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get persisted distress analysis for a chat message."""
    record = db.query(DistressResult).filter(DistressResult.message_id == message_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Distress result not found")

    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    session = db.query(ChatSession).filter(ChatSession.id == message.session_id).first()

    if current_user.role not in (UserRole.COUNSELOR, UserRole.ADMIN):
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    rule_matches = record.rule_matches or {}
    ai_analysis = record.ai_analysis
    indicators = record.indicators.get("items", []) if record.indicators else []

    return DistressAnalysisResponse(
        id=str(record.id),
        level=record.level.value,
        requires_escalation=record.level.value == "crisis"
        or (ai_analysis or {}).get("requires_escalation", False)
        or rule_matches.get("is_crisis_rule", False),
        indicators=indicators,
        rule_matches=rule_matches,
        ai_analysis=ai_analysis,
        layers_used={
            "rule_based": True,
            "ai_based": ai_analysis is not None,
        },
    )


@router.post("/analyze/batch-test", response_model=list[DistressAnalysisResponse])
@limiter.limit("10/minute")
async def batch_test_distress(
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.COUNSELOR)),
):
    """Run safety test phrases — admin/counselor only."""
    test_phrases = [
        "I had a normal day at campus",
        "I feel a bit stressed about exams",
        "I am overwhelmed with assignments",
        "I want to give up on everything",
        "I want to kill myself tonight",
    ]
    results = []
    for phrase in test_phrases:
        analysis = await distress_service.analyze_text(phrase, use_ai=False)
        results.append(_to_response(analysis))
    return results
