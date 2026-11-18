from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.organization import Team, Department, TeamMember
from app.models.user import User, Employee
from app.models.enums import UserRole
from app.schemas.organization import TeamCreate, TeamResponse, TeamMemberAdd, TeamMemberResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamResponse])
def list_teams(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Team)
    if department_id:
        query = query.filter(Team.department_id == department_id)
    teams = query.all()

    results = []
    for t in teams:
        m_count = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()
        leader_name = t.team_leader.full_name if t.team_leader else None
        results.append(TeamResponse(
            id=t.id,
            department_id=t.department_id,
            name=t.name,
            code=t.code,
            team_leader_id=t.team_leader_id,
            is_active=t.is_active,
            created_at=t.created_at,
            department_name=t.department.name if t.department else None,
            leader_name=leader_name,
            member_count=m_count
        ))
    return results

@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    existing = db.query(Team).filter(Team.code == data.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team code already exists")

    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    team = Team(
        department_id=data.department_id,
        name=data.name,
        code=data.code.upper(),
        team_leader_id=data.team_leader_id,
        is_active=data.is_active
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    log_audit_event(db, action="CREATE_TEAM", entity_type="TEAM", entity_id=str(team.id), user=current_user)

    return TeamResponse(
        id=team.id,
        department_id=team.department_id,
        name=team.name,
        code=team.code,
        team_leader_id=team.team_leader_id,
        is_active=team.is_active,
        created_at=team.created_at,
        department_name=dept.name,
        leader_name=team.team_leader.full_name if team.team_leader else None,
        member_count=0
    )

@router.get("/{id}/members", response_model=List[TeamMemberResponse])
def get_team_members(id: int, db: Session = Depends(get_db)):
    members = db.query(TeamMember).filter(TeamMember.team_id == id).all()
    results = []
    for m in members:
        results.append(TeamMemberResponse(
            id=m.id,
            team_id=m.team_id,
            employee_id=m.employee_id,
            role_in_team=m.role_in_team,
            joined_at=m.joined_at,
            employee_name=m.employee.full_name if m.employee else None,
            employee_code=m.employee.employee_code if m.employee else None,
            designation=m.employee.designation if m.employee else None
        ))
    return results

@router.post("/{id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def add_team_member(
    id: int,
    data: TeamMemberAdd,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    existing = db.query(TeamMember).filter(TeamMember.team_id == id, TeamMember.employee_id == data.employee_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee is already a member of this team")

    member = TeamMember(
        team_id=id,
        employee_id=data.employee_id,
        role_in_team=data.role_in_team
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    log_audit_event(db, action="ADD_TEAM_MEMBER", entity_type="TEAM", entity_id=str(id), user=current_user)

    return TeamMemberResponse(
        id=member.id,
        team_id=member.team_id,
        employee_id=member.employee_id,
        role_in_team=member.role_in_team,
        joined_at=member.joined_at,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        designation=emp.designation
    )

@router.delete("/{id}/members/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    id: int,
    employee_id: int,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    member = db.query(TeamMember).filter(TeamMember.team_id == id, TeamMember.employee_id == employee_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this team")

    db.delete(member)
    db.commit()
    log_audit_event(db, action="REMOVE_TEAM_MEMBER", entity_type="TEAM", entity_id=str(id), user=current_user)
    return None
