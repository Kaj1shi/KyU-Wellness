from pydantic import BaseModel, Field


MOOD_LABELS = {
    1: "Very low",
    2: "Low",
    3: "Okay",
    4: "Good",
    5: "Great",
}


class LogMoodRequest(BaseModel):
    mood_score: int = Field(ge=1, le=5)
    notes: str | None = Field(default=None, max_length=500)


class MoodEntryResponse(BaseModel):
    id: str
    mood_score: int
    mood_label: str | None
    notes: str | None
    created_at: str


class DailyCheckinRequest(BaseModel):
    energy_level: int = Field(ge=1, le=5)
    stress_level: int = Field(ge=1, le=5)
    sleep_quality: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = Field(default=None, max_length=500)


class DailyCheckinResponse(BaseModel):
    id: str
    energy_level: int
    stress_level: int
    sleep_quality: int | None
    notes: str | None
    created_at: str


class MoodTrendPoint(BaseModel):
    date: str
    mood_score: int | None = None
    mood_label: str | None = None
