from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import UserRole

KYU_FACULTIES = [
    "Faculty of Science",
    "Faculty of Engineering",
    "Faculty of Arts and Social Sciences",
    "Faculty of Education",
    "Faculty of Vocational Studies",
    "Faculty of Special Needs and Rehabilitation",
    "Other",
]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    age: int = Field(ge=16, le=100)
    gender: str = Field(min_length=1, max_length=50)
    faculty: str = Field(min_length=1, max_length=100)
    year_of_study: int = Field(ge=1, le=7)
    nickname: str | None = Field(default=None, max_length=100)
    privacy_consent: bool

    @field_validator("privacy_consent")
    @classmethod
    def consent_required(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Privacy consent is required")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GuestRequest(BaseModel):
    nickname: str | None = Field(default=None, max_length=100)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str | None
    role: UserRole
    is_anonymous: bool
    email_verified: bool
    age: int | None
    gender: str | None
    faculty: str | None
    year_of_study: int | None
    nickname: str | None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
    message: str | None = None


class MessageResponse(BaseModel):
    message: str
