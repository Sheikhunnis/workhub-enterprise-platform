from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.organization import Department, Team
from app.models.user import User, Employee
from app.models.enums import UserRole
from app.schemas.organization import DepartmentCreate, DepartmentResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    results = []
    for d in depts:
        t_count = db.query(Team).filter(Team.department_id == d.id).count()
        e_count = db.query(Employee).filter(Employee.department_id == d.id).count()
        results.append(DepartmentResponse(
            id=d.id,
            name=d.name,
            code=d.code,
            description=d.description,
            is_active=d.is_active,
            created_at=d.created_at,
            team_count=t_count,
            employee_count=e_count
        ))
    return results

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(
        (Department.name == data.name) | (Department.code == data.code)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department with this name or code already exists")

    dept = Department(
        name=data.name,
        code=data.code.upper(),
        description=data.description,
        is_active=data.is_active
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    log_audit_event(db, action="CREATE_DEPARTMENT", entity_type="DEPARTMENT", entity_id=str(dept.id), user=current_user)

    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        is_active=dept.is_active,
        created_at=dept.created_at,
        team_count=0,
        employee_count=0
    )
