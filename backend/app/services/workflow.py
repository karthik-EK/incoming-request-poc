from datetime import datetime, timedelta, timezone

from app.models import WorkflowAction
from app.services.classifier import ClassificationResult


def utc_now():
    return datetime.now(timezone.utc)


def format_time(dt: datetime):
    return dt.strftime("%d %b %Y, %I:%M %p UTC")


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


def complaint(ticket, classification):
    follow_up = utc_now() + timedelta(hours=2)

    response = (
        f"Hello {ticket.requester_name}, we received your complaint "
        f"regarding {classification.subtopic.lower()}."
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
                "output": response,
            },
            {
                "name": "Escalate",
                "output": "Escalated to Customer Recovery",
            },
            {
                "name": "Follow-up",
                "output": f"Follow-up scheduled for {format_time(follow_up)}",
            },
        ],
    }


def general(ticket, classification):
    sla = utc_now() + timedelta(days=2)

    return {
        "assigned_team": "Knowledge Operations",
        "status": "resolved",
        "draft_response": "General enquiry response generated.",
        "follow_up_at": None,
        "sla_due_at": sla,
        "actions": [
            {
                "name": "Knowledge Search",
                "output": "Knowledge article generated.",
            },
            {
                "name": "Resolve",
                "output": "Marked as resolved.",
            },
        ],
    }


def service(ticket, classification):
    sla = utc_now() + timedelta(hours=24)

    return {
        "assigned_team": "Service Fulfillment",
        "status": "in_progress",
        "draft_response": "Service request received.",
        "follow_up_at": utc_now() + timedelta(hours=12),
        "sla_due_at": sla,
        "actions": [
            {
                "name": "Route Request",
                "output": "Assigned to Service Fulfillment",
            },
            {
                "name": "SLA Started",
                "output": f"SLA until {format_time(sla)}",
            },
        ],
    }


def urgent(ticket, classification):
    return {
        "assigned_team": "Supervisor Desk",
        "status": "human_review",
        "draft_response": "Urgent request forwarded for review.",
        "follow_up_at": utc_now() + timedelta(minutes=30),
        "sla_due_at": utc_now() + timedelta(hours=1),
        "actions": [
            {
                "name": "Human Review",
                "output": "Supervisor notified",
            },
            {
                "name": "Pause Automation",
                "output": "Waiting for supervisor decision",
            },
        ],
    }


WORKFLOWS = {
    "complaint": complaint,
    "general_enquiry": general,
    "service_request": service,
    "escalation_urgent": urgent,
}