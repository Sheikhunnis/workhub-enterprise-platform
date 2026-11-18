from datetime import datetime, timezone
from typing import Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.task import Task, TaskHistory
from app.models.ticket import Ticket
from app.models.enums import TaskStatus, PriorityLevel, TicketStatus
from app.models.user import User, Employee
from app.models.collaboration import Notification

def generate_task_number(db: Session, ticket: Ticket) -> str:
    count = db.query(Task).filter(Task.ticket_id == ticket.id).count() + 1
    return f"{ticket.ticket_number}-T{count:02d}"

def create_task(
    db: Session,
    ticket: Ticket,
    title: str,
    description: str,
    created_by: User,
    priority: PriorityLevel = PriorityLevel.MEDIUM,
    assigned_employee_id: Optional[int] = None,
    estimated_hours: Decimal = Decimal("0.00"),
    start_date=None,
    due_date=None
) -> Task:
    task_number = generate_task_number(db, ticket)
    
    initial_status = TaskStatus.ASSIGNED if assigned_employee_id else TaskStatus.PENDING

    task = Task(
        task_number=task_number,
        ticket_id=ticket.id,
        created_by_id=created_by.id,
        assigned_employee_id=assigned_employee_id,
        title=title,
        description=description,
        priority=priority,
        status=initial_status,
        estimated_hours=estimated_hours,
        start_date=start_date,
        due_date=due_date
    )
    db.add(task)
    db.flush()

    # Task history
    history = TaskHistory(
        task_id=task.id,
        actor_id=created_by.id,
        action="CREATED",
        old_status=None,
        new_status=initial_status.value,
        notes=f"Task created under ticket #{ticket.ticket_number}"
    )
    db.add(history)

    # If ticket was OPEN/UNDER_REVIEW/ASSIGNED, ensure it shows work is occurring
    if ticket.status in [TicketStatus.OPEN, TicketStatus.UNDER_REVIEW]:
        ticket.status = TicketStatus.ASSIGNED

    # Notify employee if assigned
    if assigned_employee_id:
        emp = db.query(Employee).filter(Employee.id == assigned_employee_id).first()
        if emp:
            db.add(Notification(
                user_id=emp.user_id,
                title="New Task Assigned",
                message=f"You have been assigned task {task.task_number}: '{task.title}' under ticket #{ticket.ticket_number}.",
                type="ASSIGNMENT",
                link_url=f"/tasks/{task.id}"
            ))

    db.commit()
    db.refresh(task)
    return task

def update_task_status(
    db: Session,
    task: Task,
    actor: User,
    new_status: TaskStatus,
    actual_hours: Optional[Decimal] = None,
    notes: Optional[str] = None
) -> Task:
    old_status = task.status
    task.status = new_status
    if actual_hours is not None:
        task.actual_hours = actual_hours
    if new_status == TaskStatus.COMPLETED:
        task.completed_at = datetime.now(timezone.utc)

    # If the task changes to IN_PROGRESS, also advance parent ticket to IN_PROGRESS if not already
    if new_status == TaskStatus.IN_PROGRESS and task.ticket.status in [TicketStatus.OPEN, TicketStatus.UNDER_REVIEW, TicketStatus.ASSIGNED]:
        task.ticket.status = TicketStatus.IN_PROGRESS

    history = TaskHistory(
        task_id=task.id,
        actor_id=actor.id,
        action="STATUS_CHANGE",
        old_status=old_status.value,
        new_status=new_status.value,
        notes=notes or f"Status updated to {new_status.value}"
    )
    db.add(history)

    db.commit()
    db.refresh(task)
    return task
