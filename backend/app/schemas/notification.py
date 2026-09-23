from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    notification_type: str
    title: str
    body: str
    read: bool
    metadata: dict | None = None
    created_at: str


class UnreadCountResponse(BaseModel):
    count: int
