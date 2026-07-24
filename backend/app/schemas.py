from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class RequestCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=180)
    requester_name: str = Field(..., min_length=2, max_length=120)
    requester_email: EmailStr
    channel: str = Field("web_form", max_length=40)
    description: str = Field(..., min_length=10)


class BatchRequestCreate(BaseModel):
    requests: list[RequestCreate] = Field(..., min_length=1, max_length=25)


class OverrideRequest(BaseModel):
    classification: str | None = None
    urgency: str | None = None
    status: str | None = None
    note: str = "Human override applied"


class WorkflowActionRead(BaseModel):
    id: int
    sequence: int
    name: str
    status: str
    output: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogRead(BaseModel):
    id: int
    ticket_id: int | None
    event_type: str
    actor: str
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class TicketRead(BaseModel):
    id: int
    subject: str
    requester_name: str
    requester_email: str
    channel: str
    description: str
    classification: str
    urgency: str
    confidence: float
    status: str
    assigned_team: str
    draft_response: str
    action_summary: str
    ai_rationale: str
    subtopic: str
    follow_up_at: datetime | None
    sla_due_at: datetime | None
    created_at: datetime
    updated_at: datetime
    actions: list[WorkflowActionRead] = Field(default_factory=list)
    audit_logs: list[AuditLogRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DashboardMetrics(BaseModel):
    total_requests: int
    open_requests: int
    critical_requests: int
    avg_confidence: float
    by_type: list[dict[str, Any]]
    by_status: list[dict[str, Any]]
    recent_activity: list[AuditLogRead]
