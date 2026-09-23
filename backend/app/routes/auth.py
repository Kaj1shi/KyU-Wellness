from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.limiter import limiter
from app.middleware.auth import get_current_user
from app.models import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    GuestRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    user, tokens = await auth_service.register_user(db, data)
    return AuthResponse(
        user=auth_service.user_to_response(user),
        tokens=TokenResponse(**tokens),
        message="Registration successful. Please check your email to verify your account.",
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user, tokens = auth_service.login_user(db, data.email, data.password)
    return AuthResponse(
        user=auth_service.user_to_response(user),
        tokens=TokenResponse(**tokens),
    )


@router.post("/guest", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def guest_login(data: GuestRequest, db: Session = Depends(get_db)):
    user, tokens = auth_service.create_guest_user(db, data.nickname)
    return AuthResponse(
        user=auth_service.user_to_response(user),
        tokens=TokenResponse(**tokens),
        message="Anonymous session started. Your data is limited until you register.",
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    tokens = auth_service.refresh_access_token(db, data.refresh_token)
    return TokenResponse(**tokens)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user)):
    return MessageResponse(message="Logged out successfully. Please discard your tokens.")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return auth_service.user_to_response(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    await auth_service.request_password_reset(db, data.email)
    return MessageResponse(
        message="If an account exists with that email, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, data.token, data.new_password)
    return MessageResponse(message="Password reset successful. You can now sign in.")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    auth_service.verify_email(db, data.token)
    return MessageResponse(message="Email verified successfully.")


@router.get("/faculties", response_model=list[str])
def list_faculties():
    from app.schemas.auth import KYU_FACULTIES

    return KYU_FACULTIES
