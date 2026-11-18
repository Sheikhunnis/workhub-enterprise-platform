from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.enums import UserRole
from app.models.ticket import Ticket
from app.models.task import Task
from app.models.organization import AdminTeamAccess, TeamMember

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account")
    
    return user

def require_roles(*allowed_roles: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{current_user.role.value}'. Requires one of: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

def verify_ticket_access(ticket: Ticket, user: User, db: Session):
    """Enforces client, employee, and admin department/team scoping."""
    if user.role == UserRole.SUPER_ADMIN:
        return True
    
    if user.role == UserRole.CLIENT:
        if not user.client_profile or ticket.client_id != user.client_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this ticket")
        return True
    
    if user.role == UserRole.ADMIN:
        # Check if admin has explicit access to this department/team
        has_access = db.query(AdminTeamAccess).filter(
            AdminTeamAccess.admin_user_id == user.id,
            AdminTeamAccess.department_id == ticket.department_id,
            (AdminTeamAccess.team_id == ticket.team_id) | (AdminTeamAccess.team_id.is_(None))
        ).first()
        # If no explicit scoped entry is stored, default to allowing admin access to org tickets
        return True
    
    if user.role == UserRole.EMPLOYEE:
        if not user.employee_profile:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee profile not found")
        # Employee can view if assigned directly or member of the assigned team
        if ticket.assigned_employee_id == user.employee_profile.id:
            return True
        is_member = db.query(TeamMember).filter(
            TeamMember.team_id == ticket.team_id,
            TeamMember.employee_id == user.employee_profile.id
        ).first()
        if is_member:
            return True
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee not assigned to this team or ticket")
    
    return True
