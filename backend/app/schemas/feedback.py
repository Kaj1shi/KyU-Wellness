from pydantic import BaseModel, Field, model_validator


class FeedbackCreateRequest(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def require_rating_or_comment(self):
        if self.rating is None and not (self.comment and self.comment.strip()):
            raise ValueError("Provide a rating and/or a comment")
        return self


class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    rating: int | None
    comment: str | None
    created_at: str
    student_label: str | None = None
