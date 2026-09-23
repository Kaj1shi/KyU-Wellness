from pydantic import BaseModel, Field


class JournalCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str = Field(..., min_length=1, max_length=20000)


class JournalUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str | None = Field(default=None, min_length=1, max_length=20000)


class JournalEntryResponse(BaseModel):
    id: str
    title: str | None
    content: str
    created_at: str
    updated_at: str
