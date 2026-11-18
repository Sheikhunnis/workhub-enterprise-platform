from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Date, ForeignKey, Enum as SQLEnum, Text, Numeric, Index
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.models.enums import TaskStatus, PriorityLevel

class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_ticket_status", "ticket_id", "status"),
        Index("ix_tasks_assigned_employee", "assigned_employee_id"),
        Index("ix_tasks_due_date", "due_date"),
    )

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    task_number = Column(String(30), unique=True, index=True, nullable=False)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_employee_id = Column(BigInteger, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    
    estimated_hours = Column(Numeric(6, 2), default=0.00, nullable=False)
    actual_hours = Column(Numeric(6, 2), default=0.00, nullable=False)
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="tasks")
    assigned_employee = relationship("Employee", back_populates="assigned_tasks", foreign_keys=[assigned_employee_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    history = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan", order_by="TaskHistory.id.desc()")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan", order_by="TaskComment.id.asc()")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")

class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    action = Column(String(60), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    task = relationship("Task", back_populates="history")
    actor = relationship("User")

class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User")
