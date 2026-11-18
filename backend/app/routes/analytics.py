from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.analytics import OverviewMetrics
from app.services.analytics_service import get_overview_metrics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=OverviewMetrics)
def overview_analytics(
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)),
    db: Session = Depends(get_db)
):
    return get_overview_metrics(db)
