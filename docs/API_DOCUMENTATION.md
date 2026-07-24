# API Documentation

Base URL: `http://localhost:8000`

FastAPI also exposes interactive OpenAPI documentation at `/docs` and machine-readable schema at `/openapi.json`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Dashboard counts, volume by type/status, recent activity |
| POST | `/api/requests` | Submit and process one incoming request |
| POST | `/api/requests/batch` | Submit and process up to 25 requests |
| GET | `/api/requests` | List tickets with `search`, `classification`, `urgency`, and `status` filters |
| GET | `/api/requests/{ticket_id}` | Retrieve ticket details, workflow actions, and audit logs |
| POST | `/api/requests/{ticket_id}/override` | Apply human override and re-run the selected workflow branch |
| GET | `/api/audit-logs` | Retrieve processing logs, optionally filtered by `ticket_id` |
| GET | `/api/export.csv` | Export tickets as CSV |

## Submit Request

```json
{
  "subject": "Charged twice for my invoice",
  "requester_name": "Maya Sharma",
  "requester_email": "maya.sharma@example.com",
  "channel": "email",
  "description": "I was charged twice on this month's invoice and need a refund today."
}
```

## Ticket Response Shape

```json
{
  "id": 1,
  "classification": "complaint",
  "urgency": "high",
  "confidence": 0.92,
  "status": "escalated",
  "assigned_team": "Customer Recovery",
  "draft_response": "Hello Maya Sharma...",
  "action_summary": "Acknowledge complaint -> Escalate to senior handler -> Create priority case log -> Set 2-hour follow-up",
  "actions": [
    {
      "sequence": 1,
      "name": "Acknowledge complaint",
      "status": "completed",
      "output": "Hello Maya Sharma..."
    }
  ],
  "audit_logs": [
    {
      "event_type": "classification_completed",
      "actor": "system",
      "message": "Classified as complaint / high."
    }
  ]
}
```

## AI Configuration

The classifier calls an OpenAI-compatible `/chat/completions` endpoint when `OPENAI_API_KEY` is set. Configure:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

When the API key is absent or the provider call fails, the backend uses a deterministic fallback classifier for reliable local demos.
