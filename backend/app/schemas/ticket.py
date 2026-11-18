from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.enums import TicketStatus, PriorityLevel

class TicketCreate(BaseModel):
    department_id: int
    team_id: int
    title: str
    description: str
    category: Optional[str] = "General Request"
    priority: Optional[PriorityLevel] = PriorityLevel.MEDIUM

class TicketAssignRequest(BaseModel):
    team_id: int
    assigned_employee_id: Optional[int] = None
    notes: Optional[str] = None

class TicketStatusUpdateRequest(BaseModel):
    status: TicketStatus
    resolution_notes: Optional[str] = None
    remarks: Optional[str] = None

class TicketHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    actor_id: int
    actor_name: Optional[str] = None
    action: str
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

class TicketCommentCreate(BaseModel):
    content: str
    is_internal: Optional[bool] = False

class TicketCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    user_id: int
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    is_internal: bool
    created_at: datetime

class TicketBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_number: str
    title: str
    category: str
    priority: PriorityLevel
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class TicketResponse(TicketBase):
    client_id: int
    client_name: Optional[str] = None
    company_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    team_id: int
    team_name: Optional[str] = None
    assigned_employee_id: Optional[int] = None
    assigned_employee_name: Optional[str] = None
    task_count: Optional[int] = 0
    completed_task_count: Optional[int] = 0

class TicketDetailResponse(TicketResponse):
    description: str
    resolution_notes: Optional[str] = None
    history: List[TicketHistoryResponse] = []
    comments: List[TicketCommentResponse] = []
