import csv
import io
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.database import Base, engine, get_db
from app.models import AuditLog, Ticket, WorkflowAction
from app.schemas import BatchRequestCreate, DashboardMetrics, OverrideRequest, RequestCreate, TicketRead
from app.services.audit import add_audit, audit_to_dict
from app.services.classifier import ClassificationResult
from app.services.sample_data import SAMPLE_REQUESTS
from app.services.tickets import process_request
from app.services.workflow import execute_workflow


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        if db.query(Ticket).count() == 0:
            for sample in SAMPLE_REQUESTS:
                await process_request(db, RequestCreate(**sample))
    finally:
        db.close()
    yield


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered incoming request classification and remediation workflow POC.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/requests", response_model=TicketRead, status_code=201)
async def create_request(payload: RequestCreate, db: Session = Depends(get_db)):
    ticket = await process_request(db, payload)
    return _serialize_ticket(ticket)


@app.post("/api/requests/batch", response_model=list[TicketRead], status_code=201)
async def create_batch(payload: BatchRequestCreate, db: Session = Depends(get_db)):
    tickets = []
    for item in payload.requests:
        tickets.append(await process_request(db, item))
    return [_serialize_ticket(ticket) for ticket in tickets]


@app.get("/api/requests", response_model=list[TicketRead])
def list_requests(
    search: str | None = None,
    classification: str | None = None,
    urgency: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Ticket).options(selectinload(Ticket.actions), selectinload(Ticket.audit_logs))
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.subject.ilike(pattern),
                Ticket.description.ilike(pattern),
                Ticket.requester_name.ilike(pattern),
                Ticket.requester_email.ilike(pattern),
            )
        )
    if classification:
        query = query.filter(Ticket.classification == classification)
    if urgency:
        query = query.filter(Ticket.urgency == urgency)
    if status:
        query = query.filter(Ticket.status == status)
    return [_serialize_ticket(ticket) for ticket in query.order_by(desc(Ticket.created_at)).all()]


@app.get("/api/requests/{ticket_id}", response_model=TicketRead)
def get_request(ticket_id: int, db: Session = Depends(get_db)):
    ticket = _get_ticket(db, ticket_id)
    return _serialize_ticket(ticket)


@app.post("/api/requests/{ticket_id}/override", response_model=TicketRead)
def override_request(ticket_id: int, payload: OverrideRequest, db: Session = Depends(get_db)):
    ticket = _get_ticket(db, ticket_id)
    override_status = payload.status
    if payload.classification:
        ticket.classification = payload.classification
    if payload.urgency:
        ticket.urgency = payload.urgency
    db.query(WorkflowAction).filter(WorkflowAction.ticket_id == ticket.id).delete()
    result = ClassificationResult(
        classification=ticket.classification,
        urgency=ticket.urgency,
        confidence=ticket.confidence,
        subtopic=ticket.subtopic,
        rationale=f"Human override: {payload.note}",
    )
    ticket.actions = execute_workflow(ticket, result)
    if override_status:
        ticket.status = override_status
    add_audit(
        db,
        ticket.id,
        "human_override",
        payload.note,
        actor="operations_lead",
        metadata={"classification": ticket.classification, "urgency": ticket.urgency, "status": ticket.status},
    )
    db.commit()
    db.refresh(ticket)
    return _serialize_ticket(ticket)


@app.get("/api/dashboard", response_model=DashboardMetrics)
def dashboard(db: Session = Depends(get_db)):
    total = db.query(func.count(Ticket.id)).scalar() or 0
    open_count = db.query(func.count(Ticket.id)).filter(Ticket.status.in_(["open", "in_progress", "escalated", "human_review"])).scalar() or 0
    critical = db.query(func.count(Ticket.id)).filter(Ticket.urgency == "critical").scalar() or 0
    avg_confidence = db.query(func.avg(Ticket.confidence)).scalar() or 0
    by_type = [
        {"name": row[0], "value": row[1]}
        for row in db.query(Ticket.classification, func.count(Ticket.id)).group_by(Ticket.classification).all()
    ]
    by_status = [
        {"name": row[0], "value": row[1]}
        for row in db.query(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status).all()
    ]
    recent = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(8).all()
    return DashboardMetrics(
        total_requests=total,
        open_requests=open_count,
        critical_requests=critical,
        avg_confidence=round(float(avg_confidence), 2),
        by_type=by_type,
        by_status=by_status,
        recent_activity=[audit_to_dict(log) for log in recent],
    )


@app.get("/api/audit-logs")
def audit_logs(ticket_id: int | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(AuditLog)
    if ticket_id:
        query = query.filter(AuditLog.ticket_id == ticket_id)
    return [audit_to_dict(log) for log in query.order_by(desc(AuditLog.created_at)).limit(200).all()]


@app.get("/api/export.csv")
def export_csv(db: Session = Depends(get_db)):
    rows = db.query(Ticket).order_by(desc(Ticket.created_at)).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "id",
            "subject",
            "requester",
            "email",
            "classification",
            "urgency",
            "confidence",
            "status",
            "assigned_team",
            "created_at",
        ]
    )
    for ticket in rows:
        writer.writerow(
            [
                ticket.id,
                ticket.subject,
                ticket.requester_name,
                ticket.requester_email,
                ticket.classification,
                ticket.urgency,
                ticket.confidence,
                ticket.status,
                ticket.assigned_team,
                ticket.created_at.isoformat(),
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=incoming_requests.csv"},
    )


def _get_ticket(db: Session, ticket_id: int) -> Ticket:
    ticket = (
        db.query(Ticket)
        .options(selectinload(Ticket.actions), selectinload(Ticket.audit_logs))
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _serialize_ticket(ticket: Ticket) -> dict:
    return {
        "id": ticket.id,
        "subject": ticket.subject,
        "requester_name": ticket.requester_name,
        "requester_email": ticket.requester_email,
        "channel": ticket.channel,
        "description": ticket.description,
        "classification": ticket.classification,
        "urgency": ticket.urgency,
        "confidence": ticket.confidence,
        "status": ticket.status,
        "assigned_team": ticket.assigned_team,
        "draft_response": ticket.draft_response,
        "action_summary": ticket.action_summary,
        "ai_rationale": ticket.ai_rationale,
        "subtopic": ticket.subtopic,
        "follow_up_at": ticket.follow_up_at,
        "sla_due_at": ticket.sla_due_at,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "actions": ticket.actions,
        "audit_logs": [audit_to_dict(log) for log in ticket.audit_logs],
    }
