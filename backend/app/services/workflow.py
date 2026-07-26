from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.models import WorkflowAction
from app.services.classifier import ClassificationResult

IST = ZoneInfo("Asia/Kolkata")


def utc_now():
    return datetime.now(timezone.utc)


def format_time(dt: datetime) -> str:
    """Convert UTC datetime to IST for display."""
    return dt.astimezone(IST).strftime("%d %b %Y, %I:%M %p IST")


def execute_workflow(ticket, classification: ClassificationResult):
    branch = WORKFLOWS[classification.classification]
    context = branch(ticket, classification)

    ticket.assigned_team = context["assigned_team"]
    ticket.status = context["status"]
    ticket.draft_response = context["draft_response"]
    ticket.follow_up_at = context.get("follow_up_at")
    ticket.sla_due_at = context.get("sla_due_at")
    ticket.action_summary = " -> ".join(
        action["name"] for action in context["actions"]
    )

    return [
        WorkflowAction(
            sequence=index + 1,
            name=action["name"],
            status="completed",
            output=action["output"],
        )
        for index, action in enumerate(context["actions"])
    ]


# ---------------------------------------------------
# Complaint
# ---------------------------------------------------
def complaint(ticket, classification):
    follow_up = utc_now() + timedelta(hours=2)

    response = (
        f"Hello {ticket.requester_name},\n\n"
        f"We have received your complaint regarding "
        f"{classification.subtopic.lower()}.\n\n"
        "Your case has been escalated to our Customer Recovery team "
        "for priority handling.\n\n"
        "You will receive an update within the next 2 hours."
    )

    return {
        "assigned_team": "Customer Recovery",
        "status": "escalated",
        "draft_response": response,
        "follow_up_at": follow_up,
        "sla_due_at": follow_up,
        "actions": [
            {
                "name": "Acknowledge Complaint",
                "output": "Complaint acknowledgement sent.",
            },
            {
                "name": "Escalate to Senior Handler",
                "output": "Assigned to Customer Recovery team.",
            },
            {
                "name": "Create Priority Case",
                "output": "Priority complaint case created.",
            },
            {
                "name": "Schedule Follow-up",
                "output": f"Follow-up scheduled for {format_time(follow_up)}",
            },
        ],
    }


# ---------------------------------------------------
# General Enquiry
# ---------------------------------------------------
def general(ticket, classification):
    sla = utc_now() + timedelta(days=2)

    response = (
        f"Hello {ticket.requester_name},\n\n"
        "Thank you for contacting us.\n\n"
        f"Your enquiry regarding {classification.subtopic.lower()} "
        "has been reviewed.\n\n"
        "A knowledge response has been generated and the request has "
        "been marked as resolved."
    )

    return {
        "assigned_team": "Knowledge Operations",
        "status": "resolved",
        "draft_response": response,
        "follow_up_at": None,
        "sla_due_at": sla,
        "actions": [
            {
                "name": "Classify Enquiry",
                "output": f"Sub-topic identified as {classification.subtopic}",
            },
            {
                "name": "Generate Knowledge Response",
                "output": response,
            },
            {
                "name": "Mark Resolved",
                "output": "Ticket marked as resolved.",
            },
        ],
    }


# ---------------------------------------------------
# Service Request
# ---------------------------------------------------
def service(ticket, classification):
    follow_up = utc_now() + timedelta(hours=12)
    sla = utc_now() + timedelta(hours=24)

    response = (
        f"Hello {ticket.requester_name},\n\n"
        f"Your service request regarding "
        f"{classification.subtopic.lower()} has been received.\n\n"
        "It has been assigned to our Service Fulfillment team.\n\n"
        "Expected completion is within 24 hours."
    )

    return {
        "assigned_team": "Service Fulfillment",
        "status": "in_progress",
        "draft_response": response,
        "follow_up_at": follow_up,
        "sla_due_at": sla,
        "actions": [
            {
                "name": "Extract Request Details",
                "output": "Required request details extracted.",
            },
            {
                "name": "Route Request",
                "output": "Assigned to Service Fulfillment.",
            },
            {
                "name": "Generate Confirmation",
                "output": response,
            },
            {
                "name": "Start SLA Timer",
                "output": f"SLA expires on {format_time(sla)}",
            },
        ],
    }


# ---------------------------------------------------
# Escalation / Urgent
# ---------------------------------------------------
def urgent(ticket, classification):
    follow_up = utc_now() + timedelta(minutes=30)
    sla = utc_now() + timedelta(hours=1)

    response = (
        f"Hello {ticket.requester_name},\n\n"
        "Your urgent request has been flagged for immediate human review.\n\n"
        "A supervisor has been notified and automated resolution has been paused."
    )

    return {
        "assigned_team": "Supervisor Desk",
        "status": "human_review",
        "draft_response": response,
        "follow_up_at": follow_up,
        "sla_due_at": sla,
        "actions": [
            {
                "name": "Flag Human Review",
                "output": "Critical priority assigned.",
            },
            {
                "name": "Notify Supervisor",
                "output": "Supervisor notified immediately.",
            },
            {
                "name": "Pause Automation",
                "output": "Automatic resolution paused.",
            },
            {
                "name": "Set Review SLA",
                "output": f"Review deadline: {format_time(sla)}",
            },
        ],
    }


WORKFLOWS = {
    "complaint": complaint,
    "general_enquiry": general,
    "service_request": service,
    "escalation_urgent": urgent,
}