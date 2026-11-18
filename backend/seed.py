import os
import sys
from datetime import datetime, date, timezone, timedelta
from decimal import Decimal

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.enums import UserRole, EmployeeStatus, TeamMemberRole, TicketStatus, TaskStatus, PriorityLevel
from app.models.user import User, Employee, Client
from app.models.organization import Department, Team, TeamMember, AdminTeamAccess
from app.models.ticket import Ticket, TicketSequence, TicketHistory, TicketAssignment, TicketComment
from app.models.task import Task, TaskHistory, TaskComment
from app.models.collaboration import ClientFeedback, Notification
from app.models.audit import AuditLog

def seed_database():
    print("🌱 Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).filter(User.email == "superadmin@workhub.io").first():
            print("⚠️ Database already seeded. Skipping initial seeding.")
            return

        print("Creating User Accounts...")
        hashed_pwd = get_password_hash("WorkHub@2026")

        # 1. Super Admin
        super_admin = User(
            email="superadmin@workhub.io",
            password_hash=hashed_pwd,
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(super_admin)

        # 2. Scoped Admins
        admin_it = User(
            email="admin.it@workhub.io",
            password_hash=hashed_pwd,
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_it)

        # 3. Departments
        dept_dev = Department(name="Software Engineering", code="DEV", description="Core product engineering and development")
        dept_it = Department(name="Cloud & IT Infrastructure", code="IT", description="Cloud operations, networks, and IT helpdesk")
        dept_ops = Department(name="Customer Operations", code="OPS", description="Enterprise client onboarding and support")
        db.add_all([dept_dev, dept_it, dept_ops])
        db.flush()

        # 4. Teams
        team_be = Team(department_id=dept_dev.id, name="Backend Engineering", code="DEV-BE")
        team_fe = Team(department_id=dept_dev.id, name="Frontend Engineering", code="DEV-FE")
        team_ops = Team(department_id=dept_it.id, name="Cloud & DevOps", code="IT-OPS")
        team_t2 = Team(department_id=dept_ops.id, name="Tier-2 Tech Support", code="OPS-T2")
        db.add_all([team_be, team_fe, team_ops, team_t2])
        db.flush()

        # 5. Employees
        emp_alex_user = User(email="alex.lead@workhub.io", password_hash=hashed_pwd, role=UserRole.EMPLOYEE, is_active=True)
        emp_priya_user = User(email="priya.dev@workhub.io", password_hash=hashed_pwd, role=UserRole.EMPLOYEE, is_active=True)
        emp_rahul_user = User(email="rahul.ops@workhub.io", password_hash=hashed_pwd, role=UserRole.EMPLOYEE, is_active=True)
        emp_jessica_user = User(email="jessica.fe@workhub.io", password_hash=hashed_pwd, role=UserRole.EMPLOYEE, is_active=True)
        db.add_all([emp_alex_user, emp_priya_user, emp_rahul_user, emp_jessica_user])
        db.flush()

        emp_alex = Employee(
            user_id=emp_alex_user.id,
            employee_code="EMP-1001",
            first_name="Alex",
            last_name="Morgan",
            department_id=dept_dev.id,
            designation="Principal Backend Lead",
            phone="+91-9876543210",
            joining_date=date(2023, 1, 15),
            status=EmployeeStatus.ACTIVE
        )
        db.add(emp_alex)
        db.flush()

        emp_priya = Employee(
            user_id=emp_priya_user.id,
            employee_code="EMP-1002",
            first_name="Priya",
            last_name="Sharma",
            department_id=dept_dev.id,
            designation="Senior Software Engineer",
            phone="+91-9876543211",
            reporting_manager_id=emp_alex.id,
            joining_date=date(2023, 6, 1),
            status=EmployeeStatus.ACTIVE
        )
        emp_rahul = Employee(
            user_id=emp_rahul_user.id,
            employee_code="EMP-1003",
            first_name="Rahul",
            last_name="Verma",
            department_id=dept_it.id,
            designation="DevOps & Site Reliability Engineer",
            phone="+91-9876543212",
            joining_date=date(2023, 8, 10),
            status=EmployeeStatus.ACTIVE
        )
        emp_jessica = Employee(
            user_id=emp_jessica_user.id,
            employee_code="EMP-1004",
            first_name="Jessica",
            last_name="Chen",
            department_id=dept_dev.id,
            designation="UI/UX & Frontend Engineer",
            phone="+91-9876543213",
            reporting_manager_id=emp_alex.id,
            joining_date=date(2024, 2, 20),
            status=EmployeeStatus.ACTIVE
        )
        db.add_all([emp_priya, emp_rahul, emp_jessica])
        db.flush()

        # Set Team Leaders and Members
        team_be.team_leader_id = emp_alex.id
        team_ops.team_leader_id = emp_rahul.id

        db.add_all([
            TeamMember(team_id=team_be.id, employee_id=emp_alex.id, role_in_team=TeamMemberRole.LEAD),
            TeamMember(team_id=team_be.id, employee_id=emp_priya.id, role_in_team=TeamMemberRole.MEMBER),
            TeamMember(team_id=team_fe.id, employee_id=emp_jessica.id, role_in_team=TeamMemberRole.LEAD),
            TeamMember(team_id=team_ops.id, employee_id=emp_rahul.id, role_in_team=TeamMemberRole.LEAD),
        ])

        # 6. Clients
        client1_user = User(email="client.acme@workhub.io", password_hash=hashed_pwd, role=UserRole.CLIENT, is_active=True)
        client2_user = User(email="client.fintech@workhub.io", password_hash=hashed_pwd, role=UserRole.CLIENT, is_active=True)
        db.add_all([client1_user, client2_user])
        db.flush()

        client1 = Client(
            user_id=client1_user.id,
            company_name="Acme Global Technologies",
            contact_person="David Sterling",
            phone="+1-555-0199",
            address="742 Evergreen Terrace, Suite 400, Seattle, WA"
        )
        client2 = Client(
            user_id=client2_user.id,
            company_name="FinTech Capital Partners",
            contact_person="Maria Gonzalez",
            phone="+1-555-0244",
            address="100 Wall Street, Floor 18, New York, NY"
        )
        db.add_all([client1, client2])
        db.flush()

        # 7. Ticket Sequence
        current_year = datetime.now(timezone.utc).year
        seq = TicketSequence(year=current_year, last_number=3)
        db.add(seq)

        # 8. Sample Tickets & Tasks
        # Ticket 1 (In Progress)
        t1 = Ticket(
            ticket_number=f"WH-{current_year}-0001",
            client_id=client1.id,
            department_id=dept_dev.id,
            team_id=team_be.id,
            assigned_employee_id=emp_priya.id,
            title="OAuth2 Token Refresh Failure in SSO Gateway",
            description="Our employees are reporting random 401 Unauthorized errors when their session refreshes after 30 minutes of idle time. This blocks active dashboard workflows.",
            category="Authentication & Security",
            priority=PriorityLevel.CRITICAL,
            status=TicketStatus.IN_PROGRESS,
            created_at=datetime.now(timezone.utc) - timedelta(days=2, hours=4)
        )
        db.add(t1)
        db.flush()

        # Ticket 1 Tasks
        tsk1_1 = Task(
            task_number=f"{t1.ticket_number}-T01",
            ticket_id=t1.id,
            assigned_employee_id=emp_priya.id,
            created_by_id=admin_it.id,
            title="Inspect JWT expiration claims and Redis token cache",
            description="Analyze session store TTL and identify if revocation blacklist is dropping valid refresh tokens.",
            priority=PriorityLevel.HIGH,
            status=TaskStatus.COMPLETED,
            estimated_hours=Decimal("4.0"),
            actual_hours=Decimal("3.5"),
            start_date=date.today() - timedelta(days=2),
            due_date=date.today() - timedelta(days=1),
            completed_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
        tsk1_2 = Task(
            task_number=f"{t1.ticket_number}-T02",
            ticket_id=t1.id,
            assigned_employee_id=emp_priya.id,
            created_by_id=admin_it.id,
            title="Patch token exchange endpoint and update refresh window",
            description="Implement sliding session grace period according to RFC 6749 Section 6.",
            priority=PriorityLevel.CRITICAL,
            status=TaskStatus.IN_PROGRESS,
            estimated_hours=Decimal("6.0"),
            actual_hours=Decimal("2.0"),
            start_date=date.today() - timedelta(days=1),
            due_date=date.today() + timedelta(days=1)
        )
        tsk1_3 = Task(
            task_number=f"{t1.ticket_number}-T03",
            ticket_id=t1.id,
            assigned_employee_id=emp_jessica.id,
            created_by_id=admin_it.id,
            title="Verify silent token refresh on frontend Axios client",
            description="Ensure 401 interceptor queues concurrent requests during active refresh token exchange.",
            priority=PriorityLevel.MEDIUM,
            status=TaskStatus.PENDING,
            estimated_hours=Decimal("3.0"),
            start_date=date.today(),
            due_date=date.today() + timedelta(days=2)
        )
        db.add_all([tsk1_1, tsk1_2, tsk1_3])

        # Ticket 1 History
        db.add_all([
            TicketHistory(
                ticket_id=t1.id,
                actor_id=client1_user.id,
                action="CREATED",
                field_changed="status",
                old_value=None,
                new_value=TicketStatus.OPEN.value,
                remarks="Ticket submitted by David Sterling via Client Portal",
                created_at=datetime.now(timezone.utc) - timedelta(days=2, hours=4)
            ),
            TicketHistory(
                ticket_id=t1.id,
                actor_id=admin_it.id,
                action="ASSIGNED",
                field_changed="assigned_employee_id",
                old_value=None,
                new_value=emp_priya.full_name,
                remarks="Assigned to Backend Engineering with Priya Sharma as technical owner",
                created_at=datetime.now(timezone.utc) - timedelta(days=2, hours=2)
            ),
            TicketHistory(
                ticket_id=t1.id,
                actor_id=emp_priya_user.id,
                action="STATUS_CHANGE",
                field_changed="status",
                old_value=TicketStatus.ASSIGNED.value,
                new_value=TicketStatus.IN_PROGRESS.value,
                remarks="Root cause isolated to Redis cache TTL mismatch. Commencing patch.",
                created_at=datetime.now(timezone.utc) - timedelta(days=1, hours=5)
            )
        ])

        # Ticket 1 Comments
        db.add_all([
            TicketComment(
                ticket_id=t1.id,
                user_id=client1_user.id,
                content="Please prioritize this as it is impacting our European operations team during peak business hours.",
                is_internal=False,
                created_at=datetime.now(timezone.utc) - timedelta(days=2, hours=3)
            ),
            TicketComment(
                ticket_id=t1.id,
                user_id=emp_priya_user.id,
                content="Identified the issue in the token refresh window. Deploying hotfix to staging environment for verification.",
                is_internal=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=6)
            )
        ])

        # Ticket 2 (Resolved & Closed with Feedback)
        t2 = Ticket(
            ticket_number=f"WH-{current_year}-0002",
            client_id=client2.id,
            department_id=dept_it.id,
            team_id=team_ops.id,
            assigned_employee_id=emp_rahul.id,
            title="SSL Certificate Renewal for API Gateway and Webhook Listeners",
            description="Our primary ingress wildcard certificate expires in 72 hours. Need seamless renewal without dropped TCP connections.",
            category="Infrastructure & Security",
            priority=PriorityLevel.HIGH,
            status=TicketStatus.CLOSED,
            resolution_notes="Wildcard Let's Encrypt certificates deployed via Cert-Manager. Automated cert-rotation daemon verified. Zero downtime achieved.",
            resolved_at=datetime.now(timezone.utc) - timedelta(days=3),
            closed_at=datetime.now(timezone.utc) - timedelta(days=2),
            created_at=datetime.now(timezone.utc) - timedelta(days=5)
        )
        db.add(t2)
        db.flush()

        tsk2_1 = Task(
            task_number=f"{t2.ticket_number}-T01",
            ticket_id=t2.id,
            assigned_employee_id=emp_rahul.id,
            created_by_id=admin_it.id,
            title="Renew Wildcard SSL Certificate via Cloudflare DNS challenge",
            description="Trigger ACME challenge and install new cert secrets.",
            priority=PriorityLevel.HIGH,
            status=TaskStatus.COMPLETED,
            estimated_hours=Decimal("2.0"),
            actual_hours=Decimal("1.5"),
            completed_at=datetime.now(timezone.utc) - timedelta(days=4)
        )
        db.add(tsk2_1)

        # Feedback for Ticket 2
        feedback2 = ClientFeedback(
            ticket_id=t2.id,
            client_id=client2.id,
            rating=5,
            comments="Flawless execution! Certificate was renewed cleanly with no disruption to our payment webhooks. Outstanding work by Rahul Verma.",
            submitted_at=datetime.now(timezone.utc) - timedelta(days=2)
        )
        db.add(feedback2)

        # Ticket 3 (Open / Under Review)
        t3 = Ticket(
            ticket_number=f"WH-{current_year}-0003",
            client_id=client1.id,
            department_id=dept_dev.id,
            team_id=team_be.id,
            assigned_employee_id=emp_alex.id,
            title="Performance Latency on Monthly Invoicing Ledger Export",
            description="Exporting ledger reports with over 50,000 transactions times out after 60 seconds on the billing dashboard.",
            category="Performance Optimization",
            priority=PriorityLevel.MEDIUM,
            status=TicketStatus.UNDER_REVIEW,
            created_at=datetime.now(timezone.utc) - timedelta(hours=8)
        )
        db.add(t3)

        # In-app notifications
        db.add_all([
            Notification(
                user_id=super_admin.id,
                title="System Initialized",
                message="WorkHub Enterprise Service Desk is online and fully configured.",
                type="SYSTEM",
                link_url="/admin"
            ),
            Notification(
                user_id=emp_priya_user.id,
                title="Ticket Assigned",
                message=f"You are the assigned engineer for ticket #{t1.ticket_number}.",
                type="ASSIGNMENT",
                link_url=f"/tickets/{t1.id}"
            )
        ])

        db.commit()
        print("✅ Database seeding completed successfully!")
        print("\nDefault Accounts for Testing:")
        print("--------------------------------------------------")
        print("Super Admin:  superadmin@workhub.io  | WorkHub@2026")
        print("Admin:        admin.it@workhub.io    | WorkHub@2026")
        print("Employee:     priya.dev@workhub.io   | WorkHub@2026")
        print("Employee:     alex.lead@workhub.io   | WorkHub@2026")
        print("Client:       client.acme@workhub.io | WorkHub@2026")
        print("--------------------------------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during database seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
