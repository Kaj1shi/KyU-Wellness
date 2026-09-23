import json
import logging
from typing import Any

from app.models.enums import DistressLevel
from app.services.llm_client import (
    chat_model,
    extract_message_text,
    get_sync_openai_client,
    ollama_chat,
    uses_ollama,
)
from app.services.prompts.distress_classification import DISTRESS_CLASSIFICATION_PROMPT

logger = logging.getLogger(__name__)

VALID_LEVELS = {"low", "moderate", "high", "crisis"}
VALID_SENTIMENTS = {"positive", "neutral", "negative"}

_DISTRESS_SYSTEM = (
    "You classify emotional distress in student messages. "
    "Respond with JSON only in the message content."
)


def _normalize_ai_result(raw: dict[str, Any]) -> dict:
    level = str(raw.get("distress_level", "low")).lower()
    if level not in VALID_LEVELS:
        level = "low"

    sentiment = str(raw.get("sentiment", "neutral")).lower()
    if sentiment not in VALID_SENTIMENTS:
        sentiment = "neutral"

    emotions = raw.get("emotions", [])
    if not isinstance(emotions, list):
        emotions = []

    indicators = raw.get("indicators", [])
    if not isinstance(indicators, list):
        indicators = []

    confidence = raw.get("confidence", 0.5)
    try:
        confidence = float(confidence)
        confidence = max(0.0, min(1.0, confidence))
    except (TypeError, ValueError):
        confidence = 0.5

    requires_escalation = bool(raw.get("requires_escalation", False))
    if level == "crisis":
        requires_escalation = True

    return {
        "sentiment": sentiment,
        "emotions": [str(e) for e in emotions[:10]],
        "distress_level": level,
        "indicators": [str(i) for i in indicators[:10]],
        "confidence": confidence,
        "requires_escalation": requires_escalation,
        "source": "ollama" if uses_ollama() else "openai",
    }


def _parse_json_content(content: str) -> dict | None:
    text = content.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return None
        return None


def _distress_messages(text: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": _DISTRESS_SYSTEM},
        {
            "role": "user",
            "content": DISTRESS_CLASSIFICATION_PROMPT.format(text=text),
        },
    ]


async def analyze_with_ai(text: str) -> dict | None:
    """LLM structured distress classification. Returns None if API unavailable."""
    try:
        if uses_ollama():
            # Native /api/chat with think=false — needed for local reasoning models.
            result = await ollama_chat(
                _distress_messages(text),
                temperature=0.1,
                num_predict=400,
                think=False,
            )
            content = result["content"]
        else:
            client = get_sync_openai_client()
            if client is None:
                return None
            response = client.chat.completions.create(
                model=chat_model(),
                messages=_distress_messages(text),
                temperature=0.1,
                max_tokens=400,
                response_format={"type": "json_object"},
            )
            content = extract_message_text(response.choices[0].message)

        raw = _parse_json_content(content)
        if raw is None:
            return None
        return _normalize_ai_result(raw)
    except Exception:
        logger.exception("LLM distress classification failed")
        return None


def level_from_string(level: str) -> DistressLevel:
    mapping = {
        "low": DistressLevel.LOW,
        "moderate": DistressLevel.MODERATE,
        "high": DistressLevel.HIGH,
        "crisis": DistressLevel.CRISIS,
    }
    return mapping.get(level.lower(), DistressLevel.LOW)
