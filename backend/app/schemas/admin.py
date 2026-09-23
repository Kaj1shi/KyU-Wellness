from typing import Literal

from pydantic import BaseModel, EmailStr, Field

AssignableRole = Literal["student", "counselor", "admin"]


class SetRoleRequest(BaseModel):
    email: EmailStr
    role: AssignableRole


class SetRoleResponse(BaseModel):
    id: str
    email: str | None
    role: str
    message: str = Field(default="Role updated")
