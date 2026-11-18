from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.task import Task, TaskHistory, TaskComment
from app.models.ticket import Ticket
from app.models.user import User, Employee
from app.models.enums import UserRole, TaskStatus
from app.schemas.task import (
    TaskCreate, TaskResponse, TaskDetailResponse,
    TaskStatusUpdateRequest, TaskAssignRequest,
    TaskCommentCreate, TaskCommentResponse, TaskHistoryResponse
)
from app.services.task_service import create_task, update_task_status
from app.services.audit_service import log_audit_event

router = APIRouter(tags=["Tasks"])

def format_task_response(t: Task) -> TaskResponse:
    return TaskResponse(
        id=t.id,
        task_number=t.task_number,
        ticket_id=t.ticket_id,
        ticket_number=t.ticket.ticket_number if t.ticket else None,
        title=t.title,
        priority=t.priority,
        status=t.status,
        assigned_employee_id=t.assigned_employee_id,
        assigned_employee_name=t.assigned_employee.full_name if t.assigned_employee else None,
        estimated_hours=t.estimated_hours,
        actual_hours=t.actual_hours,
        start_date=t.start_date,
        due_date=t.due_date,
        completed_at=t.completed_at,
        created_at=t.created_at,
        updated_at=t.updated_at
    )

@router.post("/tickets/{ticket_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_ticket_task(
    ticket_id: int,
    data: TaskCreate,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    task = create_task(
        db=db,
        ticket=ticket,
        title=data.title,
        description=data.description,
        created_by=current_user,
        priority=data.priority,
        assigned_employee_id=data.assigned_employee_id,
        estimated_hours=data.estimated_hours or 0.0,
        start_date=data.start_date,
        due_date=data.due_date
    )

    log_audit_event(db, action="CREATE_TASK", entity_type="TASK", entity_id=str(task.id), user=current_user)

    return format_task_response(task)

@router.get("/tickets/{ticket_id}/tasks", response_model=List[TaskResponse])
def get_tasks_for_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).filter(Task.ticket_id == ticket_id).order_by(Task.id.asc()).all()
    return [format_task_response(t) for t in tasks]

@router.get("/tasks", response_model=List[TaskResponse])
def list_tasks(
    assigned_employee_id: Optional[int] = None,
    status_filter: Optional[TaskStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task)

    # Scoping by role
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_profile:
            return []
        query = query.filter(Task.assigned_employee_id == current_user.employee_profile.id)
    elif assigned_employee_id:
        query = query.filter(Task.assigned_employee_id == assigned_employee_id)

    if status_filter:
        query = query.filter(Task.status == status_filter)

    tasks = query.order_by(Task.created_at.desc()).all()
    return [format_task_response(t) for t in tasks]

@router.get("/tasks/{id}", response_model=TaskDetailResponse)
def get_task_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    summary = format_task_response(task)

    comments_list = []
    for c in task.comments:
        author_name = c.author.email
        if c.author.employee_profile:
            author_name = c.author.employee_profile.full_name
        comments_list.append(TaskCommentResponse(
            id=c.id,
            task_id=c.task_id,
            user_id=c.user_id,
            author_name=author_name,
            content=c.content,
            created_at=c.created_at
        ))

    history_list = []
    for h in task.history:
        actor_name = h.actor.email
        if h.actor.employee_profile:
            actor_name = h.actor.employee_profile.full_name
        history_list.append(TaskHistoryResponse(
            id=h.id,
            task_id=h.task_id,
            actor_id=h.actor_id,
            actor_name=actor_name,
            action=h.action,
            old_status=h.old_status,
            new_status=h.new_status,
            notes=h.notes,
            created_at=h.created_at
        ))

    return TaskDetailResponse(
        **summary.model_dump(),
        description=task.description,
        comments=comments_list,
        history=history_list
    )

@router.patch("/tasks/{id}/status", response_model=TaskResponse)
def update_task_status_endpoint(
    id: int,
    data: TaskStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Authorization: assigned employee or admin
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_profile or task.assigned_employee_id != current_user.employee_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned employee or admin can update task status")

    updated = update_task_status(
        db=db,
        task=task,
        actor=current_user,
        new_status=data.status,
        actual_hours=data.actual_hours,
        notes=data.notes
    )

    log_audit_event(db, action="UPDATE_TASK_STATUS", entity_type="TASK", entity_id=str(task.id), user=current_user)

    return format_task_response(updated)

@router.post("/tasks/{id}/assign", response_model=TaskResponse)
def reassign_task_endpoint(
    id: int,
    data: TaskAssignRequest,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    emp = db.query(Employee).filter(Employee.id == data.assigned_employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    old_emp_id = task.assigned_employee_id
    task.assigned_employee_id = emp.id
    if task.status == TaskStatus.PENDING:
        task.status = TaskStatus.ASSIGNED

    history = TaskHistory(
        task_id=task.id,
        actor_id=current_user.id,
        action="REASSIGNED",
        old_status=str(old_emp_id) if old_emp_id else "None",
        new_status=str(emp.id),
        notes=data.notes or f"Reassigned to {emp.full_name}"
    )
    db.add(history)
    db.commit()
    db.refresh(task)

    log_audit_event(db, action="ASSIGN_TASK", entity_type="TASK", entity_id=str(task.id), user=current_user)

    return format_task_response(task)

@router.post("/tasks/{id}/comments", response_model=TaskCommentResponse, status_code=status.HTTP_201_CREATED)
def add_task_comment(
    id: int,
    data: TaskCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    comment = TaskComment(
        task_id=task.id,
        user_id=current_user.id,
        content=data.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    author_name = current_user.email
    if current_user.employee_profile:
        author_name = current_user.employee_profile.full_name

    return TaskCommentResponse(
        id=comment.id,
        task_id=comment.task_id,
        user_id=comment.user_id,
        author_name=author_name,
        content=comment.content,
        created_at=comment.created_at
    )
