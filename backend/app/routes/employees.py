from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.security import get_password_hash
from app.core.permissions import get_current_user, require_roles
from app.models.user import User, Employee
from app.models.organization import Department, Team, TeamMember
from app.models.enums import UserRole, EmployeeStatus
from app.schemas.user import EmployeeCreateRequest, EmployeeProfileResponse, EmployeeUpdateRequest
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("", response_model=List[EmployeeProfileResponse])
def list_employees(
    department_id: Optional[int] = None,
    team_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if team_id:
        query = query.join(TeamMember, TeamMember.employee_id == Employee.id).filter(TeamMember.team_id == team_id)
    
    employees = query.all()
    return [
        EmployeeProfileResponse(
            id=e.id,
            employee_code=e.employee_code,
            first_name=e.first_name,
            last_name=e.last_name,
            full_name=e.full_name,
            phone=e.phone,
            department_id=e.department_id,
            designation=e.designation,
            reporting_manager_id=e.reporting_manager_id,
            joining_date=e.joining_date,
            status=e.status
        )
        for e in employees
    ]

@router.post("", response_model=EmployeeProfileResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreateRequest,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    existing_code = db.query(Employee).filter(Employee.employee_code == data.employee_code).first()
    if existing_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee code already in use")

    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    # Create User
    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=UserRole.EMPLOYEE,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create Employee Profile
    emp = Employee(
        user_id=user.id,
        employee_code=data.employee_code,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        department_id=data.department_id,
        designation=data.designation,
        reporting_manager_id=data.reporting_manager_id,
        joining_date=data.joining_date,
        status=EmployeeStatus.ACTIVE
    )
    db.add(emp)
    db.flush()

    # Add to teams if provided
    if data.team_ids:
        for tid in data.team_ids:
            member = TeamMember(team_id=tid, employee_id=emp.id)
            db.add(member)

    db.commit()
    db.refresh(emp)

    log_audit_event(db, action="CREATE_EMPLOYEE", entity_type="EMPLOYEE", entity_id=str(emp.id), user=current_user)

    return EmployeeProfileResponse(
        id=emp.id,
        employee_code=emp.employee_code,
        first_name=emp.first_name,
        last_name=emp.last_name,
        full_name=emp.full_name,
        phone=emp.phone,
        department_id=emp.department_id,
        designation=emp.designation,
        reporting_manager_id=emp.reporting_manager_id,
        joining_date=emp.joining_date,
        status=emp.status
    )
