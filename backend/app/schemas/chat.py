from datetime import datetime

from pydantic import BaseModel, Field


class ChatSessionCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ChatSessionUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class ChatSessionResponse(BaseModel):
    id: str
    title: str | None
    is_active: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    sender: str
    content: str
    created_at: str
    distress_level: str | None = None
    requires_escalation: bool | None = None


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    use_ai_distress: bool = True


class SendMessageResponse(BaseModel):
    session: ChatSessionResponse
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
    model: str | None = None
    tokens_used: int | None = None
    escalation_triggered: bool = False
    escalation_id: str | None = None
