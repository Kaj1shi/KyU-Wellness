"""Assessment scoring tests."""

import pytest

from app.models.enums import AssessmentType, SeverityLevel
from app.services.assessment_service import calculate_score


def _phq9_responses(values: list[int]) -> dict[str, int]:
    return {f"q{i + 1}": v for i, v in enumerate(values)}


def _gad7_responses(values: list[int]) -> dict[str, int]:
    return {f"q{i + 1}": v for i, v in enumerate(values)}


def _stress_responses(values: list[int]) -> dict[str, int]:
    return {f"q{i + 1}": v for i, v in enumerate(values)}


def test_phq9_low_score():
    score, severity = calculate_score(AssessmentType.PHQ9, _phq9_responses([0] * 9))
    assert score == 0
    assert severity == SeverityLevel.LOW


def test_phq9_moderate_score():
    score, severity = calculate_score(
        AssessmentType.PHQ9, _phq9_responses([1, 1, 1, 1, 2, 2, 2, 0, 0])
    )
    assert score == 10
    assert severity == SeverityLevel.MODERATE


def test_phq9_high_score():
    score, severity = calculate_score(AssessmentType.PHQ9, _phq9_responses([3] * 9))
    assert score == 27
    assert severity == SeverityLevel.HIGH


def test_gad7_moderate_score():
    score, severity = calculate_score(AssessmentType.GAD7, _gad7_responses([2, 2, 2, 1, 1, 1, 1]))
    assert score == 10
    assert severity == SeverityLevel.MODERATE


def test_stress_low_score():
    # Low distress: negative items low; positive items (reverse) high
    score, severity = calculate_score(
        AssessmentType.STRESS,
        _stress_responses([0, 0, 0, 4, 4, 0, 4, 4, 0, 0]),
    )
    assert score == 0
    assert severity == SeverityLevel.LOW


def test_stress_high_score():
    # High distress: negative items high; positive items (reverse) low
    score, severity = calculate_score(
        AssessmentType.STRESS,
        _stress_responses([4, 4, 4, 0, 0, 4, 0, 0, 4, 4]),
    )
    assert score == 40
    assert severity == SeverityLevel.HIGH


def test_invalid_response_count():
    from fastapi import HTTPException

    with pytest.raises(HTTPException):
        calculate_score(AssessmentType.PHQ9, {"q1": 1})
