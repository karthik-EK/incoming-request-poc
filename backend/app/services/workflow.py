from datetime import datetime, timedelta

from app.models import WorkflowAction
from app.services.classifier import ClassificationResult


def execute_workflow(ticket, classification: ClassificationResult) -> list[WorkflowAction]:
    branch = WORKFLOWS[classification.classification]
    context = branch(ticket, classification)
    ticket.assigned_team = context["assigned_team"]
    ticket.status = context["status"]
    ticket.draft_response = context["draft_response"]
    ticket.follow_up_at = context.get("follow_up_at")
    ticket.sla_due_at = context.get("sla_due_at")
    ticket.action_summary = " -> ".join(action["name"] for action in context["actions"])
    return [
        WorkflowAction(sequence=index + 1, name=action["name"], status="completed", output=action["output"])
        for index, action in enumerate(context["actions"])
    ]


def _format_ist(value: datetime) -> str:
    ist_value = value + timedelta(hours=5, minutes=30)
    return ist_value.strftime("%d %b %Y, %I:%M %p IST")


def _complaint(ticket, classification):
    follow_up = datetime.utcnow() + timedelta(hours=2)
    response = (
        f"Hello {ticket.requester_name}, we have received your complaint about {classification.subtopic.lower()} "
        "and escalated it to a senior handler. We will follow up within 2 hours with the next update."
    )
    return {
        "assigned_team": "Customer Recovery",
        "status": "escalated",
        "draft_response": response,
        "follow_up_at": follow_up,
        "sla_due_at": follow_up,
        "actions": [
            {"name": "Acknowledge complaint", "output": response},
            {"name": "Escalate to senior handler", "output": "Customer Recovery queue notified with high priority flag."},
            {"name": "Create priority case log", "output": "Priority complaint record created for management visibility."},
            {"name": "Set 2-hour follow-up", "output": f"Follow-up scheduled for {_format_ist(follow_up)}."},
        ],
    }


def _general_enquiry(ticket, classification):
    response = (
        f"Hello {ticket.requester_name}, thanks for reaching out. Based on your question about "
        f"{classification.subtopic.lower()}, our operations team can help with the information requested. "
        "This enquiry has been logged as resolved with the generated response ready for review."
    )
    return {
        "assigned_team": "Knowledge Operations",
        "status": "resolved",
        "draft_response": response,
        "follow_up_at": None,
        "sla_due_at": datetime.utcnow() + timedelta(days=2),
        "actions": [
            {"name": "Classify enquiry sub-topic", "output": f"Sub-topic identified as {classification.subtopic}."},
            {"name": "Generate knowledge response", "output": response},
            {"name": "Mark as resolved", "output": "Ticket moved to resolved pending quality review."},
        ],
    }


def _service_request(ticket, classification):
    sla = datetime.utcnow() + timedelta(hours=24)
    response = (
        f"Hello {ticket.requester_name}, your service request for {classification.subtopic.lower()} has been "
        f"routed to Service Fulfillment. Your SLA target is {_format_ist(sla)}."
    )
    return {
        "assigned_team": "Service Fulfillment",
        "status": "in_progress",
        "draft_response": response,
        "follow_up_at": datetime.utcnow() + timedelta(hours=12),
        "sla_due_at": sla,
        "actions": [
            {"name": "Extract required details", "output": f"Relevant request details extracted from: {ticket.subject}."},
            {"name": "Route to department", "output": "Service Fulfillment queue assigned for execution."},
            {"name": "Generate confirmation", "output": response},
            {"name": "Set SLA timer", "output": f"24-hour SLA timer set for {_format_ist(sla)}."},
        ],
    }


def _escalation_urgent(ticket, classification):
    response = (
        f"Hello {ticket.requester_name}, your urgent request has been flagged for immediate human review. "
        "A supervisor has been notified and automated resolution is paused until review is complete."
    )
    return {
        "assigned_team": "Supervisor Desk",
        "status": "human_review",
        "draft_response": response,
        "follow_up_at": datetime.utcnow() + timedelta(minutes=30),
        "sla_due_at": datetime.utcnow() + timedelta(hours=1),
        "actions": [
            {"name": "Flag for human review", "output": "Critical human-in-the-loop flag applied."},
            {"name": "Draft urgent acknowledgement", "output": response},
            {"name": "Notify supervisor", "output": "Supervisor Desk notified with critical priority."},
            {"name": "Pause auto-resolution", "output": "Automated closure disabled until supervisor decision."},
        ],
    }


WORKFLOWS = {
    "complaint": _complaint,
    "general_enquiry": _general_enquiry,
    "service_request": _service_request,
    "escalation_urgent": _escalation_urgent,
}
