"""Distress detection tests."""

import pytest

from app.models.enums import DistressLevel
from app.services import distress_service, rule_distress_service


class TestRuleDistress:
    def test_benign_text_low(self):
        result = rule_distress_service.analyze_with_rules("I had a good day at university today")
        assert result["level"] == DistressLevel.LOW.value
        assert result["match_count"] == 0
        assert result["is_crisis_rule"] is False

    def test_moderate_stress(self):
        result = rule_distress_service.analyze_with_rules("I feel stressed about exams next week")
        assert result["level"] in (DistressLevel.MODERATE.value, DistressLevel.HIGH.value)
        assert result["match_count"] >= 1

    def test_high_hopelessness(self):
        result = rule_distress_service.analyze_with_rules("I want to give up on everything")
        assert result["level"] == DistressLevel.HIGH.value
        assert "hopelessness" in result["categories"]

    def test_crisis_suicidal(self):
        result = rule_distress_service.analyze_with_rules("I want to kill myself tonight")
        assert result["level"] == DistressLevel.CRISIS.value
        assert result["is_crisis_rule"] is True
        assert result["match_count"] >= 1

    def test_crisis_self_harm(self):
        result = rule_distress_service.analyze_with_rules("Sometimes I want to hurt myself")
        assert result["level"] == DistressLevel.CRISIS.value

    def test_loneliness_high(self):
        result = rule_distress_service.analyze_with_rules("Nobody understands me at all")
        assert result["level"] == DistressLevel.HIGH.value
        assert "loneliness" in result["categories"]

    def test_academic_overwhelm(self):
        result = rule_distress_service.analyze_with_rules("I am overwhelmed with all my coursework")
        assert result["level"] == DistressLevel.HIGH.value


class TestHybridMerge:
    @pytest.mark.asyncio
    async def test_rule_crisis_not_downgraded_by_ai(self):
        rule_result = rule_distress_service.analyze_with_rules("I want to kill myself")
        ai_result = {
            "sentiment": "negative",
            "emotions": ["sadness"],
            "distress_level": "low",
            "indicators": [],
            "confidence": 0.9,
            "requires_escalation": False,
            "source": "openai",
        }
        merged = distress_service._merge_analysis(rule_result, ai_result)
        assert merged["level"] == DistressLevel.CRISIS.value
        assert merged["requires_escalation"] is True

    @pytest.mark.asyncio
    async def test_rule_only_analysis(self):
        analysis = await distress_service.analyze_text(
            "I want to kill myself", use_ai=False
        )
        assert analysis["level"] == DistressLevel.CRISIS.value
        assert analysis["requires_escalation"] is True
        assert analysis["layers_used"]["rule_based"] is True
        assert analysis["layers_used"]["ai_based"] is False

    @pytest.mark.asyncio
    async def test_benign_rule_only(self):
        analysis = await distress_service.analyze_text(
            "Looking forward to the weekend", use_ai=False
        )
        assert analysis["level"] == DistressLevel.LOW.value
        assert analysis["requires_escalation"] is False

    @pytest.mark.asyncio
    async def test_ai_escalation_merged(self):
        rule_result = rule_distress_service.analyze_with_rules("Just feeling a bit down")
        ai_result = {
            "sentiment": "negative",
            "emotions": ["despair"],
            "distress_level": "high",
            "indicators": ["hopelessness"],
            "confidence": 0.85,
            "requires_escalation": True,
            "source": "openai",
        }
        merged = distress_service._merge_analysis(rule_result, ai_result)
        assert merged["level"] == DistressLevel.HIGH.value
        assert merged["requires_escalation"] is True
