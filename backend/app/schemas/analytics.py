from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class StatusCount(BaseModel):
    status: str
    count: int

class PriorityCount(BaseModel):
    priority: str
    count: int

class DepartmentPerformance(BaseModel):
    department_id: int
    department_name: str
    total_tickets: int
    resolved_tickets: int
    resolution_rate_percent: float

class TeamWorkload(BaseModel):
    team_id: int
    team_name: str
    member_count: int
    active_tickets: int
    pending_tasks: int
    completed_tasks: int

class EmployeePerformance(BaseModel):
    employee_id: int
    employee_name: str
    designation: str
    department_name: str
    assigned_tasks: int
    completed_tasks: int
    overdue_tasks: int
    on_time_completion_rate: float
    average_completion_hours: float

class OverviewMetrics(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    total_tasks: int
    pending_tasks: int
    completed_tasks: int
    overdue_tasks: int
    total_employees: int
    total_clients: int
    total_departments: int
    total_teams: int
    ticket_status_distribution: List[StatusCount]
    ticket_priority_distribution: List[PriorityCount]
    team_workloads: List[TeamWorkload]
    department_performances: List[DepartmentPerformance]
    top_performers: List[EmployeePerformance]
