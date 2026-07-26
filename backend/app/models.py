from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    subject: Mapped[str] = mapped_column(String(180), nullable=False)
    requester_name: Mapped[str] = mapped_column(String(120), nullable=False)
    requester_email: Mapped[str] = mapped_column(String(180), nullable=False)
    channel: Mapped[str] = mapped_column(String(40), default="web_form")
    description: Mapped[str] = mapped_column(Text, nullable=False)

    classification: Mapped[str] = mapped_column(String(60), index=True)
    urgency: Mapped[str] = mapped_column(String(30), index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)

    status: Mapped[str] = mapped_column(String(40), default="open", index=True)

    assigned_team: Mapped[str] = mapped_column(
        String(80),
        default="Operations Triage",
    )

    draft_response: Mapped[str] = mapped_column(Text, default="")
    action_summary: Mapped[str] = mapped_column(Text, default="")
    ai_rationale: Mapped[str] = mapped_column(Text, default="")
    subtopic: Mapped[str] = mapped_column(String(100), default="General")

    follow_up_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    sla_due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    actions: Mapped[list["WorkflowAction"]] = relationship(
        "WorkflowAction",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="WorkflowAction.sequence",
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="AuditLog.created_at",
    )


class WorkflowAction(Base):
    __tablename__ = "workflow_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"),
        index=True,
    )

    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(40),
        default="completed",
    )

    output: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    ticket: Mapped["Ticket"] = relationship(
        "Ticket",
        back_populates="actions",
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    ticket_id: Mapped[int | None] = mapped_column(
        ForeignKey("tickets.id"),
        nullable=True,
        index=True,
    )

    event_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    actor: Mapped[str] = mapped_column(
        String(80),
        default="system",
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    metadata_json: Mapped[str] = mapped_column(
        Text,
        default="{}",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        index=True,
    )

    ticket: Mapped["Ticket | None"] = relationship(
        "Ticket",
        back_populates="audit_logs",
    )