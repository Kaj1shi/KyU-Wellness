from app.data.distress_patterns import DISTRESS_RULES, LEVEL_RANK
from app.models.enums import DistressLevel


def analyze_with_rules(text: str) -> dict:
    """Synchronous rule-based distress screening."""
    normalized = text.lower().strip()
    matches: list[dict] = []
    categories: set[str] = set()
    max_level = DistressLevel.LOW

    for rule in DISTRESS_RULES:
        phrase = rule["phrase"]
        if phrase in normalized:
            matches.append(
                {
                    "phrase": phrase,
                    "category": rule["category"],
                    "level": rule["level"].value,
                }
            )
            categories.add(rule["category"])
            if LEVEL_RANK[rule["level"]] > LEVEL_RANK[max_level]:
                max_level = rule["level"]

    return {
        "level": max_level.value,
        "matches": matches,
        "categories": sorted(categories),
        "is_crisis_rule": max_level == DistressLevel.CRISIS,
        "match_count": len(matches),
    }
