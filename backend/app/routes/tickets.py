from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.core.permissions import get_current_user, require_roles, verify_ticket_access
from app.models.ticket import Ticket, TicketHistory, TicketComment
from app.models.task import Task
from app.models.user import User, Client, Employee
from app.models.organization import TeamMember
from app.models.collaboration import ClientFeedback, Notification
from app.models.enums import UserRole, TicketStatus, TaskStatus
from app.schemas.ticket import (
    TicketCreate, TicketResponse, TicketDetailResponse,
    TicketAssignRequest, TicketStatusUpdateRequest,
    TicketCommentCreate, TicketCommentResponse, TicketHistoryResponse
)
from app.schemas.collaboration import FeedbackCreate, FeedbackResponse
from app.services.ticket_service import create_ticket, assign_ticket, update_ticket_status
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/tickets", tags=["Tickets"])

def format_ticket_summary(t: Ticket, db: Session) -> TicketResponse:
    task_count = db.query(Task).filter(Task.ticket_id == t.id).count()
    completed_task_count = db.query(Task).filter(Task.ticket_id == t.id, Task.status == TaskStatus.COMPLETED).count()

    return TicketResponse(
        id=t.id,
        ticket_number=t.ticket_number,
        title=t.title,
        category=t.category,
        priority=t.priority,
        status=t.status,
        created_at=t.created_at,
        updated_at=t.updated_at,
        resolved_at=t.resolved_at,
        closed_at=t.closed_at,
        client_id=t.client_id,
        client_name=t.client.contact_person if t.client else None,
        company_name=t.client.company_name if t.client else None,
        department_id=t.department_id,
        department_name=t.department.name if t.department else None,
        team_id=t.team_id,
        team_name=t.team.name if t.team else None,
        assigned_employee_id=t.assigned_employee_id,
        assigned_employee_name=t.assigned_employee.full_name if t.assigned_employee else None,
        task_count=task_count,
        completed_task_count=completed_task_count
    )

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def submit_ticket(
    data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure user has a client profile or allow admin to specify
    if current_user.role == UserRole.CLIENT:
        if not current_user.client_profile:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client profile not found")
        client_id = current_user.client_profile.id
    elif current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        # If admin is creating a ticket, attach to first available client or require client profile
        first_client = db.query(Client).first()
        if not first_client:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No client exists in system")
        client_id = first_client.id
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients or administrators can create tickets")

    ticket = create_ticket(
        db=db,
        client_id=client_id,
        department_id=data.department_id,
        team_id=data.team_id,
        title=data.title,
        description=data.description,
        category=data.category or "General Request",
        priority=data.priority,
        creator_user=current_user
    )

    log_audit_event(db, action="CREATE_TICKET", entity_type="TICKET", entity_id=str(ticket.id), user=current_user)

    return format_ticket_summary(ticket, db)

@router.get("", response_model=List[TicketResponse])
def list_tickets(
    status_filter: Optional[TicketStatus] = None,
    department_id: Optional[int] = None,
    team_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)

    # Scoping by role
    if current_user.role == UserRole.CLIENT:
        if not current_user.client_profile:
            return []
        query = query.filter(Ticket.client_id == current_user.client_profile.id)

    elif current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_profile:
            return []
        # Find all teams employee belongs to
        team_ids = [m.team_id for m in current_user.employee_profile.team_memberships]
        query = query.filter(
            or_(
                Ticket.assigned_employee_id == current_user.employee_profile.id,
                Ticket.team_id.in_(team_ids)
            )
        )

    # Scoping filters
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if department_id:
        query = query.filter(Ticket.department_id == department_id)
    if team_id:
        query = query.filter(Ticket.team_id == team_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(search_pattern),
                Ticket.title.ilike(search_pattern),
                Ticket.description.ilike(search_pattern)
            )
        )

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return [format_ticket_summary(t, db) for t in tickets]

@router.get("/track/{ticket_number}", response_model=TicketDetailResponse)
def track_ticket_by_number(
    ticket_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.ticket_number == ticket_number.strip().upper()).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket '{ticket_number}' not found")

    verify_ticket_access(ticket, current_user, db)
    return get_ticket_details(ticket.id, current_user, db)

@router.get("/{id}", response_model=TicketDetailResponse)
def get_ticket_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    verify_ticket_access(ticket, current_user, db)

    summary = format_ticket_summary(ticket, db)

    # Prepare History
    history_list = []
    for h in ticket.history:
        actor_name = h.actor.email
        if h.actor.employee_profile:
            actor_name = h.actor.employee_profile.full_name
        elif h.actor.client_profile:
            actor_name = h.actor.client_profile.contact_person
        history_list.append(TicketHistoryResponse(
            id=h.id,
            ticket_id=h.ticket_id,
            actor_id=h.actor_id,
            actor_name=actor_name,
            action=h.action,
            field_changed=h.field_changed,
            old_value=h.old_value,
            new_value=h.new_value,
            remarks=h.remarks,
            created_at=h.created_at
        ))

    # Prepare Comments: hide internal comments from client
    comments_list = []
    for c in ticket.comments:
        if c.is_internal and current_user.role == UserRole.CLIENT:
            continue
        author_name = c.author.email
        if c.author.employee_profile:
            author_name = c.author.employee_profile.full_name
        elif c.author.client_profile:
            author_name = c.author.client_profile.contact_person
        comments_list.append(TicketCommentResponse(
            id=c.id,
            ticket_id=c.ticket_id,
            user_id=c.user_id,
            author_name=author_name,
            author_role=c.author.role.value,
            content=c.content,
            is_internal=c.is_internal,
            created_at=c.created_at
        ))

    return TicketDetailResponse(
        **summary.model_dump(),
        description=ticket.description,
        resolution_notes=ticket.resolution_notes,
        history=history_list,
        comments=comments_list
    )

@router.post("/{id}/assign", response_model=TicketResponse)
def assign_ticket_endpoint(
    id: int,
    data: TicketAssignRequest,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    updated = assign_ticket(
        db=db,
        ticket=ticket,
        assigned_by=current_user,
        team_id=data.team_id,
        employee_id=data.assigned_employee_id,
        notes=data.notes
    )

    log_audit_event(db, action="ASSIGN_TICKET", entity_type="TICKET", entity_id=str(ticket.id), user=current_user)

    return format_ticket_summary(updated, db)

@router.patch("/{id}/status", response_model=TicketResponse)
def update_status_endpoint(
    id: int,
    data: TicketStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    verify_ticket_access(ticket, current_user, db)

    # Permission check: Clients can only close or reopen their resolved tickets
    if current_user.role == UserRole.CLIENT:
        if data.status not in [TicketStatus.CLOSED, TicketStatus.REOPENED]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Clients can only Close or Reopen tickets."
            )

    updated = update_ticket_status(
        db=db,
        ticket=ticket,
        actor=current_user,
        new_status=data.status,
        resolution_notes=data.resolution_notes,
        remarks=data.remarks
    )

    log_audit_event(db, action="UPDATE_TICKET_STATUS", entity_type="TICKET", entity_id=str(ticket.id), user=current_user)

    return format_ticket_summary(updated, db)

@router.post("/{id}/comments", response_model=TicketCommentResponse, status_code=status.HTTP_201_CREATED)
def add_ticket_comment(
    id: int,
    data: TicketCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    verify_ticket_access(ticket, current_user, db)

    # Clients cannot create internal comments
    is_internal = data.is_internal if current_user.role != UserRole.CLIENT else False

    comment = TicketComment(
        ticket_id=ticket.id,
        user_id=current_user.id,
        content=data.content,
        is_internal=is_internal
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    author_name = current_user.email
    if current_user.employee_profile:
        author_name = current_user.employee_profile.full_name
    elif current_user.client_profile:
        author_name = current_user.client_profile.contact_person

    return TicketCommentResponse(
        id=comment.id,
        ticket_id=comment.ticket_id,
        user_id=comment.user_id,
        author_name=author_name,
        author_role=current_user.role.value,
        content=comment.content,
        is_internal=comment.is_internal,
        created_at=comment.created_at
    )

@router.post("/{id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_ticket_feedback(
    id: int,
    data: FeedbackCreate,
    current_user: User = Depends(require_roles(UserRole.CLIENT)),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    if ticket.client_id != current_user.client_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if ticket.status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only submit feedback for resolved or closed tickets")

    existing = db.query(ClientFeedback).filter(ClientFeedback.ticket_id == ticket.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Feedback already submitted for this ticket")

    feedback = ClientFeedback(
        ticket_id=ticket.id,
        client_id=current_user.client_profile.id,
        rating=data.rating,
        comments=data.comments
    )
    db.add(feedback)

    # Automatically move to CLOSED if currently RESOLVED
    if ticket.status == TicketStatus.RESOLVED:
        ticket.status = TicketStatus.CLOSED

    db.commit()
    db.refresh(feedback)

    return FeedbackResponse(
        id=feedback.id,
        ticket_id=feedback.ticket_id,
        client_id=feedback.client_id,
        client_name=current_user.client_profile.contact_person,
        rating=feedback.rating,
        comments=feedback.comments,
        submitted_at=feedback.submitted_at
    )
