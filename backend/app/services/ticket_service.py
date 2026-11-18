from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.ticket import Ticket, TicketSequence, TicketHistory, TicketAssignment
from app.models.task import Task
from app.models.enums import TicketStatus, TaskStatus, PriorityLevel, UserRole
from app.models.user import User
from app.models.collaboration import Notification

def generate_ticket_number(db: Session) -> str:
    current_year = datetime.now(timezone.utc).year
    # Atomic counter using row-locking
    seq = db.query(TicketSequence).filter(TicketSequence.year == current_year).with_for_update().first()
    if not seq:
        seq = TicketSequence(year=current_year, last_number=1)
        db.add(seq)
        seq_num = 1
    else:
        seq.last_number += 1
        seq_num = seq.last_number
    
    return f"WH-{current_year}-{seq_num:04d}"

def create_ticket(
    db: Session,
    client_id: int,
    department_id: int,
    team_id: int,
    title: str,
    description: str,
    category: str,
    priority: PriorityLevel,
    creator_user: User
) -> Ticket:
    ticket_number = generate_ticket_number(db)
    
    ticket = Ticket(
        ticket_number=ticket_number,
        client_id=client_id,
        department_id=department_id,
        team_id=team_id,
        title=title,
        description=description,
        category=category,
        priority=priority,
        status=TicketStatus.OPEN
    )
    db.add(ticket)
    db.flush()  # Obtain ticket.id

    # Create immutable history entry
    history = TicketHistory(
        ticket_id=ticket.id,
        actor_id=creator_user.id,
        action="CREATED",
        field_changed="status",
        old_value=None,
        new_value=TicketStatus.OPEN.value,
        remarks=f"Ticket submitted by client with priority {priority.value}"
    )
    db.add(history)

    # In-app notification for creator
    notif = Notification(
        user_id=creator_user.id,
        title="Ticket Submitted",
        message=f"Your ticket #{ticket_number} has been submitted successfully.",
        type="STATUS",
        link_url=f"/tickets/{ticket.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(ticket)
    return ticket

def assign_ticket(
    db: Session,
    ticket: Ticket,
    assigned_by: User,
    team_id: int,
    employee_id: Optional[int],
    notes: Optional[str]
) -> Ticket:
    old_team_id = ticket.team_id
    old_emp_id = ticket.assigned_employee_id
    old_status = ticket.status

    ticket.team_id = team_id
    ticket.assigned_employee_id = employee_id
    if ticket.status in [TicketStatus.OPEN, TicketStatus.UNDER_REVIEW]:
        ticket.status = TicketStatus.ASSIGNED

    # Log assignment record
    assignment_log = TicketAssignment(
        ticket_id=ticket.id,
        assigned_by_id=assigned_by.id,
        assigned_team_id=team_id,
        assigned_employee_id=employee_id,
        notes=notes
    )
    db.add(assignment_log)

    # Log history
    history = TicketHistory(
        ticket_id=ticket.id,
        actor_id=assigned_by.id,
        action="ASSIGNED" if not old_emp_id else "REASSIGNED",
        field_changed="assigned_employee_id",
        old_value=str(old_emp_id) if old_emp_id else "Unassigned",
        new_value=str(employee_id) if employee_id else "Team Assignment Only",
        remarks=notes or "Assigned by administration"
    )
    db.add(history)

    # Notify assigned employee if present
    if employee_id:
        from app.models.user import Employee
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if emp:
            db.add(Notification(
                user_id=emp.user_id,
                title="New Ticket Assigned",
                message=f"You have been assigned as the lead on ticket #{ticket.ticket_number}.",
                type="ASSIGNMENT",
                link_url=f"/tickets/{ticket.id}"
            ))

    db.commit()
    db.refresh(ticket)
    return ticket

def update_ticket_status(
    db: Session,
    ticket: Ticket,
    actor: User,
    new_status: TicketStatus,
    resolution_notes: Optional[str] = None,
    remarks: Optional[str] = None
) -> Ticket:
    old_status = ticket.status

    # Business Rule: Check if trying to resolve with pending tasks
    if new_status == TicketStatus.RESOLVED:
        pending_tasks = db.query(Task).filter(
            Task.ticket_id == ticket.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.ON_HOLD])
        ).count()
        if pending_tasks > 0 and actor.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot resolve ticket #{ticket.ticket_number}. There are {pending_tasks} task(s) still in progress."
            )
        ticket.resolved_at = datetime.now(timezone.utc)
        if resolution_notes:
            ticket.resolution_notes = resolution_notes

    elif new_status == TicketStatus.CLOSED:
        ticket.closed_at = datetime.now(timezone.utc)

    elif new_status == TicketStatus.REOPENED:
        ticket.resolved_at = None
        ticket.closed_at = None

    ticket.status = new_status

    # Record immutable audit history
    history = TicketHistory(
        ticket_id=ticket.id,
        actor_id=actor.id,
        action="STATUS_CHANGE",
        field_changed="status",
        old_value=old_status.value,
        new_value=new_status.value,
        remarks=remarks or resolution_notes or f"Status changed to {new_status.value}"
    )
    db.add(history)

    # Notify client of status change
    if ticket.client and ticket.client.user_id:
        db.add(Notification(
            user_id=ticket.client.user_id,
            title=f"Ticket #{ticket.ticket_number} Updated",
            message=f"Your ticket status changed from {old_status.value} to {new_status.value}.",
            type="STATUS",
            link_url=f"/tickets/{ticket.id}"
        ))

    db.commit()
    db.refresh(ticket)
    return ticket
