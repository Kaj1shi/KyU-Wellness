from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models import User
from app.models.enums import AssessmentType, UserRole
from app.schemas.assessment import (
    AssessmentHistoryItem,
    AssessmentQuestionsResponse,
    AssessmentResultResponse,
    AssessmentSummaryResponse,
    AssessmentTrendsResponse,
    Question,
    QuestionOption,
    SubmitAssessmentRequest,
    TrendPoint,
)
from app.services import assessment_service

router = APIRouter(prefix="/assessment", tags=["assessment"])


def _block_guest(user: User) -> None:
    if user.role == UserRole.GUEST:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest users cannot save assessments. Please register for full access.",
        )


@router.get("/questions/{assessment_type}", response_model=AssessmentQuestionsResponse)
def get_questions(assessment_type: AssessmentType, current_user: User = Depends(get_current_user)):
    definition = assessment_service.get_definition(assessment_type)
    return AssessmentQuestionsResponse(
        assessment_type=assessment_type.value,
        title=definition["title"],
        description=definition["description"],
        instructions=definition["instructions"],
        options=[QuestionOption(**o) for o in definition["options"]],
        questions=[Question(**q) for q in definition["questions"]],
        max_score=definition["max_score"],
    )


@router.post("/submit", response_model=AssessmentResultResponse, status_code=201)
def submit_assessment(
    data: SubmitAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _block_guest(current_user)
    assessment = assessment_service.submit_assessment(
        db, current_user, data.assessment_type, data.responses
    )
    return AssessmentResultResponse(**assessment_service.assessment_to_summary(assessment))


@router.get("/results", response_model=AssessmentSummaryResponse)
def get_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _block_guest(current_user)
    latest = assessment_service.get_latest_by_type(db, current_user)
    history = assessment_service.get_user_assessments(db, current_user)

    latest_response: dict[str, AssessmentResultResponse | None] = {}
    for atype in AssessmentType:
        record = latest.get(atype)
        latest_response[atype.value] = (
            AssessmentResultResponse(**assessment_service.assessment_to_summary(record))
            if record
            else None
        )

    return AssessmentSummaryResponse(
        latest=latest_response,
        history_count=len(history),
    )


@router.get("/history", response_model=list[AssessmentHistoryItem])
def get_history(
    assessment_type: AssessmentType | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _block_guest(current_user)
    records = assessment_service.get_user_assessments(
        db, current_user, assessment_type, limit
    )
    items = []
    for r in records:
        definition = assessment_service.get_definition(r.assessment_type)
        items.append(
            AssessmentHistoryItem(
                id=str(r.id),
                assessment_type=r.assessment_type.value,
                title=definition["title"],
                score=r.score,
                max_score=definition["max_score"],
                severity=r.severity.value,
                completed_at=r.completed_at.isoformat(),
            )
        )
    return items


@router.get("/trends", response_model=AssessmentTrendsResponse)
def get_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _block_guest(current_user)

    def build_trend(atype: AssessmentType) -> list[TrendPoint]:
        records = assessment_service.get_user_assessments(db, current_user, atype, limit=20)
        records = sorted(records, key=lambda r: r.completed_at)
        return [
            TrendPoint(
                date=r.completed_at.strftime("%Y-%m-%d"),
                score=r.score,
                severity=r.severity.value,
            )
            for r in records
        ]

    return AssessmentTrendsResponse(
        phq9=build_trend(AssessmentType.PHQ9),
        gad7=build_trend(AssessmentType.GAD7),
        stress=build_trend(AssessmentType.STRESS),
    )


@router.get("/result/{assessment_id}", response_model=AssessmentResultResponse)
def get_result_by_id(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from uuid import UUID

    from app.models import Assessment
    from fastapi import HTTPException, status

    _block_guest(current_user)
    record = (
        db.query(Assessment)
        .filter(Assessment.id == UUID(assessment_id), Assessment.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    return AssessmentResultResponse(**assessment_service.assessment_to_summary(record))
