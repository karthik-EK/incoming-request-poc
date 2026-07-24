from sqlalchemy.orm import Session

from app.models import Ticket
from app.schemas import RequestCreate
from app.services.audit import add_audit
from app.services.classifier import classify_request
from app.services.workflow import execute_workflow


async def process_request(db: Session, payload: RequestCreate) -> Ticket:
    classification = await classify_request(payload.subject, payload.description)
    ticket = Ticket(
        subject=payload.subject,
        requester_name=payload.requester_name,
        requester_email=str(payload.requester_email),
        channel=payload.channel,
        description=payload.description,
        classification=classification.classification,
        urgency=classification.urgency,
        confidence=classification.confidence,
        ai_rationale=classification.rationale,
        subtopic=classification.subtopic,
    )
    actions = execute_workflow(ticket, classification)
    ticket.actions.extend(actions)
    db.add(ticket)
    db.flush()
    add_audit(
        db,
        ticket.id,
        "classification_completed",
        f"Classified as {ticket.classification} / {ticket.urgency}.",
        metadata={"confidence": ticket.confidence, "rationale": ticket.ai_rationale},
    )
    add_audit(
        db,
        ticket.id,
        "workflow_executed",
        ticket.action_summary,
        metadata={"assigned_team": ticket.assigned_team, "status": ticket.status},
    )
    db.commit()
    db.refresh(ticket)
    return ticket
