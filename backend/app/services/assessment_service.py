from fastapi import HTTPException, status

from app.data.assessment_questions import ASSESSMENT_DEFINITIONS, WELLNESS_TIPS
from app.models import Assessment, User
from app.models.enums import AssessmentType, SeverityLevel
from sqlalchemy.orm import Session


def get_definition(assessment_type: AssessmentType) -> dict:
    definition = ASSESSMENT_DEFINITIONS.get(assessment_type)
    if not definition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return definition


def calculate_score(assessment_type: AssessmentType, responses: dict[str, int]) -> tuple[int, SeverityLevel]:
    definition = get_definition(assessment_type)
    questions = definition["questions"]
    options = definition["options"]
    valid_values = {opt["value"] for opt in options}

    if len(responses) != len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {len(questions)} responses",
        )

    question_ids = {q["id"] for q in questions}
    if set(responses.keys()) != question_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Response keys do not match assessment questions",
        )

    question_by_id = {q["id"]: q for q in questions}
    max_option = max(valid_values)

    total = 0
    for qid, value in responses.items():
        if not isinstance(value, int) or value not in valid_values:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid value for {qid}",
            )
        question = question_by_id[qid]
        if question.get("reverse_scored"):
            total += max_option - value
        else:
            total += value

    severity = SeverityLevel.LOW
    for low, high, level in definition["severity_thresholds"]:
        if low <= total <= high:
            severity = level
            break

    return total, severity


def submit_assessment(
    db: Session,
    user: User,
    assessment_type: AssessmentType,
    responses: dict[str, int],
) -> Assessment:
    score, severity = calculate_score(assessment_type, responses)

    assessment = Assessment(
        user_id=user.id,
        assessment_type=assessment_type,
        responses=responses,
        score=score,
        severity=severity,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def get_user_assessments(
    db: Session,
    user: User,
    assessment_type: AssessmentType | None = None,
    limit: int = 50,
) -> list[Assessment]:
    query = db.query(Assessment).filter(Assessment.user_id == user.id)
    if assessment_type:
        query = query.filter(Assessment.assessment_type == assessment_type)
    return query.order_by(Assessment.completed_at.desc()).limit(limit).all()


def get_latest_by_type(db: Session, user: User) -> dict[AssessmentType, Assessment]:
    latest: dict[AssessmentType, Assessment] = {}
    for atype in AssessmentType:
        record = (
            db.query(Assessment)
            .filter(Assessment.user_id == user.id, Assessment.assessment_type == atype)
            .order_by(Assessment.completed_at.desc())
            .first()
        )
        if record:
            latest[atype] = record
    return latest


def get_wellness_tips(assessment_type: AssessmentType, severity: SeverityLevel) -> list[str]:
    return WELLNESS_TIPS.get(assessment_type, {}).get(severity, [])


def assessment_to_summary(assessment: Assessment) -> dict:
    definition = get_definition(assessment.assessment_type)
    return {
        "id": str(assessment.id),
        "assessment_type": assessment.assessment_type.value,
        "title": definition["title"],
        "score": assessment.score,
        "max_score": definition["max_score"],
        "severity": assessment.severity.value,
        "severity_label": definition["severity_labels"].get(assessment.severity, ""),
        "wellness_tips": get_wellness_tips(assessment.assessment_type, assessment.severity),
        "completed_at": assessment.completed_at.isoformat(),
    }
