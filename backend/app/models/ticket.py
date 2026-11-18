from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, Index
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.models.enums import TicketStatus, PriorityLevel

class TicketSequence(Base):
    __tablename__ = "ticket_sequences"

    year = Column(Integer, primary_key=True)
    last_number = Column(Integer, nullable=False, default=0)

class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (
        Index("ix_tickets_client_status", "client_id", "status"),
        Index("ix_tickets_team_status", "team_id", "status"),
        Index("ix_tickets_created_at", "created_at"),
    )

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    ticket_number = Column(String(30), unique=True, index=True, nullable=False)
    client_id = Column(BigInteger, ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_employee_id = Column(BigInteger, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="General Request")
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False, index=True)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.OPEN, nullable=False, index=True)
    
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="tickets")
    department = relationship("Department", back_populates="tickets")
    team = relationship("Team", back_populates="tickets")
    assigned_employee = relationship("Employee", back_populates="assigned_tickets", foreign_keys=[assigned_employee_id])
    tasks = relationship("Task", back_populates="ticket", cascade="all, delete-orphan", order_by="Task.id")
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketHistory.id.desc()")
    assignments = relationship("TicketAssignment", back_populates="ticket", cascade="all, delete-orphan")
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketComment.id.asc()")
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")
    feedback = relationship("ClientFeedback", back_populates="ticket", uselist=False, cascade="all, delete-orphan")

class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    action = Column(String(60), nullable=False)  # CREATED, REVIEWED, ASSIGNED, STATUS_CHANGE, REOPENED, etc.
    field_changed = Column(String(60), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="history")
    actor = relationship("User")

class TicketAssignment(Base):
    __tablename__ = "ticket_assignments"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    assigned_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    assigned_employee_id = Column(BigInteger, ForeignKey("employees.id"), nullable=True)
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="assignments")
    assigned_by = relationship("User")
    assigned_team = relationship("Team")
    assigned_employee = relationship("Employee")

class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)  # If true, hidden from clients
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User")
