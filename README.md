# Incoming Request Processing Workflow POC

AI-powered enterprise operations console for classifying incoming customer requests and executing type-specific remediation workflows.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui-style reusable components
- Backend: FastAPI, Python, SQLAlchemy
- Database: SQLite
- AI: OpenAI-compatible chat completions API using `OPENAI_API_KEY`, with deterministic fallback when no key is configured

## Workflow Design

The system accepts requests from web form, email, or shared inbox channels. Each request is classified by request type, urgency, confidence, sub-topic, and rationale. The workflow engine then executes a branch-specific remediation plan and records every action in SQLite.

| Branch | Default urgency | Remediation strategy |
| --- | --- | --- |
| Complaint | High | Acknowledge receipt, escalate to Customer Recovery, create priority case log, set 2-hour follow-up |
| General Enquiry | Low | Classify sub-topic, generate knowledge response, mark resolved, log outcome |
| Service Request | Medium | Extract details, route to Service Fulfillment, generate confirmation, set SLA timer |
| Escalation / Urgent | Critical | Flag for human review, draft urgent acknowledgement, notify supervisor, pause auto-resolution |

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set `OPENAI_API_KEY` in `backend/.env` to enable live AI classification. Without it, the classifier uses deterministic keyword logic so the POC remains demo-ready.

### Frontend

```bash
cd frontend
npm.cmd install
copy .env.example .env
npm.cmd run dev
```

Open `http://localhost:5173`. The API docs are available at `http://localhost:8000/docs`.

## End-to-End Examples

- Complaint: "Charged twice for my invoice" becomes high urgency, routes to Customer Recovery, drafts an acknowledgement, and sets a 2-hour follow-up.
- General Enquiry: "Question about available billing plans" becomes low urgency, generates a knowledge response, and resolves the case.
- Service Request: "Please activate service for new location" becomes medium urgency, routes to Service Fulfillment, confirms receipt, and sets a 24-hour SLA.
- Escalation / Urgent: "Urgent suspected fraud on account" becomes critical, notifies Supervisor Desk, pauses auto-resolution, and requires human review.

## Included Deliverables

- Dashboard with request volumes by type/status and recent activity
- Request submission and batch intake
- Ticket list with search, filters, and CSV export
- Ticket details page with classification, generated response, workflow timeline, and override control
- Audit logs for classification, workflow execution, and human overrides
- Seeded sample dataset
- API documentation in `docs/API_DOCUMENTATION.md`
- Sample inputs and output logs in `samples/`
- Five-slide summary deck in `docs/Incoming_Request_POC_Summary.pptx`
