from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ticket import Ticket
from app.models.task import Task
from app.models.organization import Department, Team, TeamMember
from app.models.user import User, Employee, Client
from app.models.enums import TicketStatus, TaskStatus, PriorityLevel
from app.schemas.analytics import OverviewMetrics, StatusCount, PriorityCount, TeamWorkload, DepartmentPerformance, EmployeePerformance

def get_overview_metrics(db: Session) -> OverviewMetrics:
    today = date.today()

    total_tickets = db.query(Ticket).count()
    open_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.OPEN).count()
    in_progress_tickets = db.query(Ticket).filter(Ticket.status.in_([TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS])).count()
    resolved_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.RESOLVED).count()
    closed_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.CLOSED).count()

    total_tasks = db.query(Task).count()
    pending_tasks = db.query(Task).filter(Task.status.in_([TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.ON_HOLD])).count()
    completed_tasks = db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count()
    overdue_tasks = db.query(Task).filter(
        Task.due_date < today,
        Task.status != TaskStatus.COMPLETED,
        Task.status != TaskStatus.CANCELLED
    ).count()

    total_employees = db.query(Employee).count()
    total_clients = db.query(Client).count()
    total_departments = db.query(Department).count()
    total_teams = db.query(Team).count()

    # Status distribution
    status_counts = []
    for s in TicketStatus:
        cnt = db.query(Ticket).filter(Ticket.status == s).count()
        status_counts.append(StatusCount(status=s.value, count=cnt))

    # Priority distribution
    priority_counts = []
    for p in PriorityLevel:
        cnt = db.query(Ticket).filter(Ticket.priority == p).count()
        priority_counts.append(PriorityCount(priority=p.value, count=cnt))

    # Team workloads
    team_workloads = []
    teams = db.query(Team).all()
    for t in teams:
        members = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()
        active_tix = db.query(Ticket).filter(
            Ticket.team_id == t.id,
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS])
        ).count()
        # Tasks linked to tickets of this team
        pending_tsk = db.query(Task).join(Ticket, Task.ticket_id == Ticket.id).filter(
            Ticket.team_id == t.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS])
        ).count()
        comp_tsk = db.query(Task).join(Ticket, Task.ticket_id == Ticket.id).filter(
            Ticket.team_id == t.id,
            Task.status == TaskStatus.COMPLETED
        ).count()

        team_workloads.append(TeamWorkload(
            team_id=t.id,
            team_name=t.name,
            member_count=members,
            active_tickets=active_tix,
            pending_tasks=pending_tsk,
            completed_tasks=comp_tsk
        ))

    # Department performance
    dept_perfs = []
    depts = db.query(Department).all()
    for d in depts:
        tot = db.query(Ticket).filter(Ticket.department_id == d.id).count()
        res = db.query(Ticket).filter(Ticket.department_id == d.id, Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED])).count()
        rate = round((res / tot * 100.0), 1) if tot > 0 else 0.0
        dept_perfs.append(DepartmentPerformance(
            department_id=d.id,
            department_name=d.name,
            total_tickets=tot,
            resolved_tickets=res,
            resolution_rate_percent=rate
        ))

    # Top performers calculation
    top_performers = []
    employees = db.query(Employee).limit(10).all()
    for e in employees:
        assigned = db.query(Task).filter(Task.assigned_employee_id == e.id).count()
        completed = db.query(Task).filter(Task.assigned_employee_id == e.id, Task.status == TaskStatus.COMPLETED).count()
        overdue = db.query(Task).filter(
            Task.assigned_employee_id == e.id,
            Task.due_date < today,
            Task.status != TaskStatus.COMPLETED,
            Task.status != TaskStatus.CANCELLED
        ).count()

        # On-time completion: completed tasks where completed_at <= due_date (or due_date is None)
        ot_rate = 100.0
        if completed > 0:
            ot_count = db.query(Task).filter(
                Task.assigned_employee_id == e.id,
                Task.status == TaskStatus.COMPLETED,
                (Task.completed_at <= Task.due_date) | (Task.due_date.is_(None))
            ).count()
            ot_rate = round((ot_count / completed) * 100.0, 1)

        # Average hours
        avg_hrs = db.query(func.avg(Task.actual_hours)).filter(
            Task.assigned_employee_id == e.id,
            Task.status == TaskStatus.COMPLETED
        ).scalar() or 0.0

        top_performers.append(EmployeePerformance(
            employee_id=e.id,
            employee_name=e.full_name,
            designation=e.designation,
            department_name=e.department.name if e.department else "N/A",
            assigned_tasks=assigned,
            completed_tasks=completed,
            overdue_tasks=overdue,
            on_time_completion_rate=ot_rate,
            average_completion_hours=round(float(avg_hrs), 1)
        ))

    return OverviewMetrics(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        in_progress_tickets=in_progress_tickets,
        resolved_tickets=resolved_tickets,
        closed_tickets=closed_tickets,
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        total_employees=total_employees,
        total_clients=total_clients,
        total_departments=total_departments,
        total_teams=total_teams,
        ticket_status_distribution=status_counts,
        ticket_priority_distribution=priority_counts,
        team_workloads=team_workloads,
        department_performances=dept_perfs,
        top_performers=top_performers
    )
