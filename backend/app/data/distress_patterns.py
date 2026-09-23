"""Rule-based distress pattern definitions."""

from app.models.enums import DistressLevel

# Each rule: phrase (lowercase), category, assigned level when matched
DISTRESS_RULES: list[dict] = [
    # --- CRISIS: suicidal ideation & self-harm ---
    {"phrase": "kill myself", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    {"phrase": "want to die", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    {"phrase": "end my life", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    {"phrase": "suicide", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    {"phrase": "better off dead", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    {"phrase": "don't want to live", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    {"phrase": "do not want to live", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    {"phrase": "hurt myself", "category": "self_harm", "level": DistressLevel.CRISIS},
    {"phrase": "harm myself", "category": "self_harm", "level": DistressLevel.CRISIS},
    {"phrase": "cut myself", "category": "self_harm", "level": DistressLevel.CRISIS},
    {"phrase": "self harm", "category": "self_harm", "level": DistressLevel.CRISIS},
    {"phrase": "self-harm", "category": "self_harm", "level": DistressLevel.CRISIS},
    {"phrase": "overdose", "category": "self_harm", "level": DistressLevel.CRISIS},
    {"phrase": "no reason to live", "category": "suicidal_ideation", "level": DistressLevel.CRISIS},
    # --- HIGH ---
    {"phrase": "want to give up", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "i give up", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "feel useless", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "i am useless", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "i'm useless", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "nobody understands me", "category": "loneliness", "level": DistressLevel.HIGH},
    {"phrase": "no one understands", "category": "loneliness", "level": DistressLevel.HIGH},
    {"phrase": "can't go on", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "cannot go on", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "i am overwhelmed", "category": "academic_stress", "level": DistressLevel.HIGH},
    {"phrase": "i'm overwhelmed", "category": "academic_stress", "level": DistressLevel.HIGH},
    {"phrase": "completely hopeless", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "no hope", "category": "hopelessness", "level": DistressLevel.HIGH},
    {"phrase": "panic attack", "category": "panic", "level": DistressLevel.HIGH},
    {"phrase": "can't breathe", "category": "panic", "level": DistressLevel.HIGH},
    {"phrase": "heart is racing", "category": "panic", "level": DistressLevel.HIGH},
    {"phrase": "so alone", "category": "loneliness", "level": DistressLevel.HIGH},
    {"phrase": "completely alone", "category": "loneliness", "level": DistressLevel.HIGH},
    # --- MODERATE ---
    {"phrase": "i am overwhelmed", "category": "academic_stress", "level": DistressLevel.MODERATE},
    {"phrase": "stressed about exams", "category": "academic_stress", "level": DistressLevel.MODERATE},
    {"phrase": "exam stress", "category": "academic_stress", "level": DistressLevel.MODERATE},
    {"phrase": "failed my exam", "category": "academic_stress", "level": DistressLevel.MODERATE},
    {"phrase": "feeling anxious", "category": "anxiety", "level": DistressLevel.MODERATE},
    {"phrase": "so anxious", "category": "anxiety", "level": DistressLevel.MODERATE},
    {"phrase": "feel lonely", "category": "loneliness", "level": DistressLevel.MODERATE},
    {"phrase": "feeling lonely", "category": "loneliness", "level": DistressLevel.MODERATE},
    {"phrase": "can't sleep", "category": "anxiety", "level": DistressLevel.MODERATE},
    {"phrase": "trouble sleeping", "category": "anxiety", "level": DistressLevel.MODERATE},
    {"phrase": "burned out", "category": "burnout", "level": DistressLevel.MODERATE},
    {"phrase": "burnt out", "category": "burnout", "level": DistressLevel.MODERATE},
    {"phrase": "burnout", "category": "burnout", "level": DistressLevel.MODERATE},
    {"phrase": "too much pressure", "category": "academic_stress", "level": DistressLevel.MODERATE},
    {"phrase": "worried about", "category": "anxiety", "level": DistressLevel.MODERATE},
]

# Deduplicate by phrase keeping highest severity
def _dedupe_rules(rules: list[dict]) -> list[dict]:
    level_rank = {
        DistressLevel.LOW: 0,
        DistressLevel.MODERATE: 1,
        DistressLevel.HIGH: 2,
        DistressLevel.CRISIS: 3,
    }
    best: dict[str, dict] = {}
    for rule in rules:
        phrase = rule["phrase"]
        if phrase not in best or level_rank[rule["level"]] > level_rank[best[phrase]["level"]]:
            best[phrase] = rule
    return list(best.values())


DISTRESS_RULES = _dedupe_rules(DISTRESS_RULES)

LEVEL_RANK = {
    DistressLevel.LOW: 0,
    DistressLevel.MODERATE: 1,
    DistressLevel.HIGH: 2,
    DistressLevel.CRISIS: 3,
}
