from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.enums import TaskStatus, PriorityLevel

class TaskCreate(BaseModel):
    title: str
    description: str
    priority: Optional[PriorityLevel] = PriorityLevel.MEDIUM
    assigned_employee_id: Optional[int] = None
    estimated_hours: Optional[Decimal] = Decimal("0.00")
    start_date: Optional[date] = None
    due_date: Optional[date] = None

class TaskAssignRequest(BaseModel):
    assigned_employee_id: int
    notes: Optional[str] = None

class TaskStatusUpdateRequest(BaseModel):
    status: TaskStatus
    actual_hours: Optional[Decimal] = None
    notes: Optional[str] = None

class TaskCommentCreate(BaseModel):
    content: str

class TaskCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_id: int
    user_id: int
    author_name: Optional[str] = None
    content: str
    created_at: datetime

class TaskHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_id: int
    actor_id: int
    actor_name: Optional[str] = None
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_number: str
    ticket_id: int
    ticket_number: Optional[str] = None
    title: str
    priority: PriorityLevel
    status: TaskStatus
    assigned_employee_id: Optional[int] = None
    assigned_employee_name: Optional[str] = None
    estimated_hours: Decimal
    actual_hours: Decimal
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class TaskDetailResponse(TaskResponse):
    description: str
    comments: List[TaskCommentResponse] = []
    history: List[TaskHistoryResponse] = []
