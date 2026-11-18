from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, Date, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.models.enums import UserRole, EmployeeStatus

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CLIENT)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    client_profile = relationship("Client", back_populates="user", uselist=False, cascade="all, delete-orphan")
    employee_profile = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="Employee.user_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    admin_team_access = relationship("AdminTeamAccess", back_populates="admin_user", cascade="all, delete-orphan")

class Client(Base):
    __tablename__ = "clients"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(25), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="client_profile")
    tickets = relationship("Ticket", back_populates="client")
    feedbacks = relationship("ClientFeedback", back_populates="client")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(25), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), nullable=False)
    reporting_manager_id = Column(BigInteger, ForeignKey("employees.id"), nullable=True)
    joining_date = Column(Date, nullable=False)
    status = Column(SQLEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="employee_profile", foreign_keys=[user_id])
    department = relationship("Department", back_populates="employees", foreign_keys=[department_id])
    manager = relationship("Employee", remote_side=[id], backref="direct_reports")
    team_memberships = relationship("TeamMember", back_populates="employee", cascade="all, delete-orphan")
    assigned_tickets = relationship("Ticket", back_populates="assigned_employee", foreign_keys="Ticket.assigned_employee_id")
    assigned_tasks = relationship("Task", back_populates="assigned_employee", foreign_keys="Task.assigned_employee_id")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
