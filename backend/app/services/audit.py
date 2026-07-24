import json

from app.models import AuditLog


def add_audit(db, ticket_id: int | None, event_type: str, message: str, actor: str = "system", metadata: dict | None = None):
    log = AuditLog(
        ticket_id=ticket_id,
        event_type=event_type,
        actor=actor,
        message=message,
        metadata_json=json.dumps(metadata or {}),
    )
    db.add(log)
    return log


def audit_to_dict(log: AuditLog) -> dict:
    try:
        metadata = json.loads(log.metadata_json or "{}")
    except json.JSONDecodeError:
        metadata = {}
    return {
        "id": log.id,
        "ticket_id": log.ticket_id,
        "event_type": log.event_type,
        "actor": log.actor,
        "message": log.message,
        "metadata": metadata,
        "created_at": log.created_at,
    }
