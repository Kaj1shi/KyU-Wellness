from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import require_roles
from app.models import User
from app.models.enums import UserRole
from app.schemas.counselor import (
    CounselorDashboardResponse,
    StudentCaseloadItem,
    StudentDetailResponse,
)
from app.services import counselor_service

router = APIRouter(prefix="/counselor", tags=["counselor"])


@router.get("/dashboard", response_model=CounselorDashboardResponse)
def get_counselor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    data = counselor_service.build_counselor_dashboard(db, current_user)
    return CounselorDashboardResponse(**data)


@router.get("/students", response_model=list[StudentCaseloadItem])
def list_students(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    items = counselor_service.list_student_caseload(db, limit=limit)
    return [StudentCaseloadItem(**item) for item in items]


@router.get("/students/{student_id}", response_model=StudentDetailResponse)
def get_student_detail(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.COUNSELOR, UserRole.ADMIN)),
):
    return StudentDetailResponse(**counselor_service.get_student_detail(db, student_id))
