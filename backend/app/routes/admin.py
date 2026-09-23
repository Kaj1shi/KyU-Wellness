from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import require_roles
from app.models import User
from app.models.enums import UserRole
from app.schemas.admin import SetRoleRequest, SetRoleResponse
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/users/set-role", response_model=SetRoleResponse)
def set_user_role(
    data: SetRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = admin_service.set_user_role(db, str(data.email), data.role)
    return SetRoleResponse(
        id=str(user.id),
        email=user.email,
        role=user.role.value,
        message=f"Role set to {user.role.value}",
    )
