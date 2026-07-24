# Requirement Traceability

## Mandatory Requirements

| Requirement from POC document | Implementation |
| --- | --- |
| Accept incoming request via form, file upload, or simulated inbox | Single request form, batch JSON intake, channel field, seeded simulated inbox data |
| Use AI to classify request by type and urgency | OpenAI-compatible classifier with deterministic fallback |
| Branch into type-specific remediation workflow | Workflow engine maps classification to Complaint, General Enquiry, Service Request, Escalation / Urgent branches |
| Execute at least two downstream steps per branch | Each branch executes three or four persisted `WorkflowAction` rows |
| Minimum three distinct request types | Four branches implemented |
| Produce classification label and urgency level | Ticket detail, list, API response, CSV export |
| Produce branch-specific action summary | `action_summary` and workflow timeline |
| Produce generated outputs | Draft response, routing notification, SLA/follow-up flags, supervisor notification outputs |
| README with setup and workflow design | Root `README.md` |
| One end-to-end example per branch | `README.md` and `samples/sample_outputs.json` |
| Working demo package | FastAPI and Vite apps with seed data |
| Five-slide summary deck | `docs/Incoming_Request_POC_Summary.pptx` |
| Supporting assets | `samples/sample_requests.json`, `samples/sample_outputs.json`, `samples/sample_processing_logs.md`, audit logs in app |

## Optional Enhancements

| Optional enhancement | Implementation |
| --- | --- |
| Batch processing of multiple requests | `POST /api/requests/batch` and Batch tab in Submit page |
| Processing log or audit trail | `audit_logs` table, Audit Logs page, `/api/audit-logs` |
| Summary dashboard | Dashboard page and `/api/dashboard` |
| Escalation override mechanism | Ticket detail override form and `/api/requests/{id}/override` |
| Search | Ticket queue search across subject, description, requester name, email |
| Filters | Classification, urgency, and status filters |
| CSV Export | `/api/export.csv` and queue export button |
| Timeline | Ticket detail workflow timeline |

## Evaluation Rubric Fit

- Classification accuracy and branching logic quality: four justified workflow branches, urgency assignment, confidence, rationale, sub-topic, and fallback reliability.
- End-to-end reliability: seeded data, SQLite persistence, deterministic local operation, audit logs, and explicit workflow outputs.
- Communication clarity: README, API docs, traceability matrix, samples, and fixed-structure summary deck.
- Creativity and edge cases: human review path, override flow, SLA/follow-up policy, batch processing, and provider failure fallback.
