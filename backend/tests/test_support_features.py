"""Support feature helpers (journal / feedback / appointments)."""

import pytest
from pydantic import ValidationError

from app.schemas.feedback import FeedbackCreateRequest
from app.services.appointment_service import VALID_STATUSES
from app.services.admin_service import ASSIGNABLE


def test_feedback_requires_rating_or_comment():
    FeedbackCreateRequest(rating=4)
    FeedbackCreateRequest(comment="Great support")
    with pytest.raises(ValidationError):
        FeedbackCreateRequest()


def test_appointment_statuses():
    assert "pending" in VALID_STATUSES
    assert "scheduled" in VALID_STATUSES
    assert "completed" in VALID_STATUSES
    assert "cancelled" in VALID_STATUSES


def test_assignable_roles():
    assert set(ASSIGNABLE.keys()) == {"student", "counselor", "admin"}
