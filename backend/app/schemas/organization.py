from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.enums import TeamMemberRole

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    team_count: Optional[int] = 0
    employee_count: Optional[int] = 0

class TeamBase(BaseModel):
    department_id: int
    name: str
    code: str
    team_leader_id: Optional[int] = None
    is_active: bool = True

class TeamCreate(TeamBase):
    pass

class TeamMemberAdd(BaseModel):
    employee_id: int
    role_in_team: Optional[TeamMemberRole] = TeamMemberRole.MEMBER

class TeamMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_id: int
    employee_id: int
    role_in_team: TeamMemberRole
    joined_at: datetime
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    designation: Optional[str] = None

class TeamResponse(TeamBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    department_name: Optional[str] = None
    leader_name: Optional[str] = None
    member_count: Optional[int] = 0
