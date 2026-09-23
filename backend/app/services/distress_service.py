from uuid import UUID

from sqlalchemy.orm import Session

from app.data.distress_patterns import LEVEL_RANK
from app.models import DistressResult
from app.models.enums import DistressLevel
from app.services import ai_distress_service, rule_distress_service


def _max_level(a: DistressLevel, b: DistressLevel) -> DistressLevel:
    return a if LEVEL_RANK[a] >= LEVEL_RANK[b] else b


def _merge_analysis(
    rule_result: dict,
    ai_result: dict | None,
) -> dict:
    rule_level = DistressLevel(rule_result["level"])
    final_level = rule_level
    requires_escalation = rule_result["is_crisis_rule"]
    indicators = list(rule_result.get("categories", []))

    if ai_result:
        ai_level = ai_distress_service.level_from_string(ai_result["distress_level"])

        # Rule crisis cannot be downgraded by AI
        if rule_result["is_crisis_rule"]:
            final_level = DistressLevel.CRISIS
        else:
            final_level = _max_level(rule_level, ai_level)

        requires_escalation = requires_escalation or ai_result.get("requires_escalation", False)
        if final_level == DistressLevel.CRISIS:
            requires_escalation = True

        indicators = list(
            dict.fromkeys(indicators + ai_result.get("indicators", []) + ai_result.get("emotions", []))
        )
    elif rule_level == DistressLevel.CRISIS:
        requires_escalation = True

    return {
        "level": final_level.value,
        "distress_level": final_level,
        "requires_escalation": requires_escalation,
        "indicators": indicators,
        "rule_matches": rule_result,
        "ai_analysis": ai_result,
        "layers_used": {
            "rule_based": True,
            "ai_based": ai_result is not None,
        },
    }


async def analyze_text(text: str, use_ai: bool = True) -> dict:
    """Hybrid distress analysis without database persistence."""
    rule_result = rule_distress_service.analyze_with_rules(text)
    ai_result = await ai_distress_service.analyze_with_ai(text) if use_ai else None
    return _merge_analysis(rule_result, ai_result)


async def analyze_and_persist(
    db: Session,
    message_id: UUID,
    text: str,
    use_ai: bool = True,
) -> DistressResult:
    """Analyze distress and save result linked to a chat message."""
    analysis = await analyze_text(text, use_ai=use_ai)

    existing = (
        db.query(DistressResult).filter(DistressResult.message_id == message_id).first()
    )
    if existing:
        existing.level = analysis["distress_level"]
        existing.indicators = {"items": analysis["indicators"]}
        existing.rule_matches = analysis["rule_matches"]
        existing.ai_analysis = analysis["ai_analysis"]
        db.commit()
        db.refresh(existing)
        return existing

    record = DistressResult(
        message_id=message_id,
        level=analysis["distress_level"],
        indicators={"items": analysis["indicators"]},
        rule_matches=analysis["rule_matches"],
        ai_analysis=analysis["ai_analysis"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def distress_result_to_dict(record: DistressResult) -> dict:
    return {
        "id": str(record.id),
        "message_id": str(record.message_id),
        "level": record.level.value,
        "indicators": record.indicators,
        "rule_matches": record.rule_matches,
        "ai_analysis": record.ai_analysis,
        "created_at": record.created_at.isoformat(),
    }


def analysis_to_response(analysis: dict, persisted_id: str | None = None) -> dict:
    return {
        "id": persisted_id,
        "level": analysis["level"],
        "requires_escalation": analysis["requires_escalation"],
        "indicators": analysis["indicators"],
        "rule_matches": analysis["rule_matches"],
        "ai_analysis": analysis["ai_analysis"],
        "layers_used": analysis["layers_used"],
    }
