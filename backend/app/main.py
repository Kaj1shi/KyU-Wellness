from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config.settings import settings
from app.limiter import limiter
from app.routes.admin import router as admin_router
from app.routes.appointments import router as appointments_router
from app.routes.assessment import router as assessment_router
from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.counselor import router as counselor_router
from app.routes.dashboard import router as dashboard_router
from app.routes.distress import router as distress_router
from app.routes.escalations import router as escalations_router
from app.routes.feedback import router as feedback_router
from app.routes.health import router as health_router
from app.routes.journal import router as journal_router
from app.routes.notifications import router as notifications_router
from app.routes.wellness import router as wellness_router


def _maybe_seed_counselor() -> None:
    """Optional bootstrap: create a counselor if SEED_COUNSELOR_EMAIL is set and missing."""
    email = (getattr(settings, "seed_counselor_email", None) or "").strip()
    password = (getattr(settings, "seed_counselor_password", None) or "").strip()
    if not email or not password:
        return

    from app.config.database import SessionLocal
    from app.models import User
    from app.models.enums import UserRole
    from app.utils.security import hash_password

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            if existing.role not in (UserRole.COUNSELOR, UserRole.ADMIN):
                existing.role = UserRole.COUNSELOR
                db.commit()
            return
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            role=UserRole.COUNSELOR,
            email_verified=True,
            is_active=True,
            privacy_consent=True,
            nickname="Counselor",
        )
        db.add(user)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _maybe_seed_counselor()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix=settings.api_prefix)
    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(assessment_router, prefix=settings.api_prefix)
    app.include_router(distress_router, prefix=settings.api_prefix)
    app.include_router(chat_router, prefix=settings.api_prefix)
    app.include_router(escalations_router, prefix=settings.api_prefix)
    app.include_router(notifications_router, prefix=settings.api_prefix)
    app.include_router(dashboard_router, prefix=settings.api_prefix)
    app.include_router(wellness_router, prefix=settings.api_prefix)
    app.include_router(journal_router, prefix=settings.api_prefix)
    app.include_router(feedback_router, prefix=settings.api_prefix)
    app.include_router(appointments_router, prefix=settings.api_prefix)
    app.include_router(counselor_router, prefix=settings.api_prefix)
    app.include_router(admin_router, prefix=settings.api_prefix)

    @app.get("/")
    def root():
        return {
            "message": "Kyambogo University Mental Health Support API",
            "docs": "/docs",
            "health": f"{settings.api_prefix}/health",
        }

    return app


app = create_app()
