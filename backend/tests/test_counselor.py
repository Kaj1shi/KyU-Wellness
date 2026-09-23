"""Counselor service unit tests."""

from app.services.counselor_service import _student_summary
from app.models.enums import UserRole


class _FakeUser:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id", "00000000-0000-0000-0000-000000000001")
        self.nickname = kwargs.get("nickname")
        self.email = kwargs.get("email")
        self.faculty = kwargs.get("faculty")
        self.year_of_study = kwargs.get("year_of_study")
        self.is_anonymous = kwargs.get("is_anonymous", False)
        self.role = kwargs.get("role", UserRole.STUDENT)


class TestStudentSummary:
    def test_registered_student(self):
        user = _FakeUser(
            email="student@kyu.ac.ug",
            nickname="Alex",
            faculty="Engineering",
            year_of_study=2,
        )
        summary = _student_summary(user)
        assert summary["email"] == "student@kyu.ac.ug"
        assert summary["nickname"] == "Alex"
        assert summary["is_anonymous"] is False

    def test_anonymous_guest(self):
        user = _FakeUser(is_anonymous=True, nickname="Guest-123")
        summary = _student_summary(user)
        assert summary["nickname"] == "Guest-123"
        assert summary["is_anonymous"] is True
