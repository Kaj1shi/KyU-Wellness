from app.schemas.wellness import MOOD_LABELS
from app.services.wellness_service import _mood_label, _today_bounds_utc


class TestMoodLabels:
    def test_all_scores_have_labels(self):
        for score in range(1, 6):
            assert _mood_label(score) == MOOD_LABELS[score]

    def test_unknown_score(self):
        assert _mood_label(99) == "Unknown"


class TestTodayBounds:
    def test_bounds_span_one_day(self):
        start, end = _today_bounds_utc()
        assert (end - start).total_seconds() == 24 * 60 * 60
        assert start.tzinfo is not None
        assert end.tzinfo is not None


class TestMoodTrendShape:
    def test_trend_fills_calendar_days(self, monkeypatch):
        from datetime import datetime, timezone
        from app.services import wellness_service

        fixed = datetime(2026, 7, 25, 10, 0, tzinfo=timezone.utc)

        class FixedDateTime(datetime):
            @classmethod
            def now(cls, tz=None):
                if tz is None:
                    return fixed.replace(tzinfo=None)
                return fixed.astimezone(tz)

        monkeypatch.setattr(wellness_service, "datetime", FixedDateTime)

        class FakeQuery:
            def filter(self, *args, **kwargs):
                return self

            def order_by(self, *args, **kwargs):
                return self

            def all(self):
                return []

        class FakeDB:
            def query(self, *args, **kwargs):
                return FakeQuery()

        class FakeUser:
            id = "user-1"

        points = wellness_service.get_mood_trend(FakeDB(), FakeUser(), days=14)
        assert len(points) == 14
        assert points[-1]["date"] == "2026-07-25"
        assert points[-1]["mood_score"] is None
        assert all("date" in p for p in points)


class TestCheckinOncePerDay:
    def test_log_checkin_rejects_second_entry(self, monkeypatch):
        from datetime import datetime, timezone
        from fastapi import HTTPException
        from app.services import wellness_service

        fixed = datetime(2026, 7, 25, 10, 0, tzinfo=timezone.utc)

        class FakeEntry:
            id = "c1"
            energy_level = 3
            stress_level = 2
            sleep_quality = 4
            notes = None
            created_at = fixed

        class FakeQuery:
            def filter(self, *args, **kwargs):
                return self

            def order_by(self, *args, **kwargs):
                return self

            def first(self):
                return FakeEntry()

        class FakeDB:
            def query(self, *args, **kwargs):
                return FakeQuery()

        class FakeUser:
            id = "user-1"

        monkeypatch.setattr(
            wellness_service,
            "_today_bounds_utc",
            lambda now=None: (
                datetime(2026, 7, 24, 21, 0, tzinfo=timezone.utc),
                datetime(2026, 7, 25, 21, 0, tzinfo=timezone.utc),
            ),
        )

        try:
            wellness_service.log_checkin(
                FakeDB(),
                FakeUser(),
                energy_level=4,
                stress_level=3,
                sleep_quality=3,
            )
            assert False, "expected HTTPException"
        except HTTPException as exc:
            assert exc.status_code == 409
            assert "already completed" in exc.detail.lower()
