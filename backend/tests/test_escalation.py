"""Escalation service unit tests."""

from app.services.escalation_service import _student_label
from app.models.enums import UserRole


class _FakeUser:
    def __init__(self, **kwargs):
        self.nickname = kwargs.get("nickname")
        self.email = kwargs.get("email")
        self.is_anonymous = kwargs.get("is_anonymous", False)
        self.role = kwargs.get("role", UserRole.STUDENT)


class TestStudentLabel:
    def test_anonymous_nickname(self):
        user = _FakeUser(is_anonymous=True, nickname="Guest-abc")
        assert _student_label(user) == "Guest-abc"

    def test_anonymous_without_nickname(self):
        user = _FakeUser(is_anonymous=True)
        assert _student_label(user) == "Anonymous student"

    def test_registered_email(self):
        user = _FakeUser(email="student@kyu.ac.ug", nickname="piima")
        assert _student_label(user) == "piima"

    def test_fallback_student(self):
        user = _FakeUser()
        assert _student_label(user) == "Student"
