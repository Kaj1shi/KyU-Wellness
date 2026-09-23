"""Chat session schema checks for rename/delete API."""

import pytest
from pydantic import ValidationError

from app.schemas.chat import ChatSessionUpdateRequest


def test_rename_request_accepts_title():
    data = ChatSessionUpdateRequest(title="Campus stress")
    assert data.title == "Campus stress"


def test_rename_request_rejects_empty_title():
    with pytest.raises(ValidationError):
        ChatSessionUpdateRequest(title="")
