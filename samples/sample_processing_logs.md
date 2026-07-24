# Sample Processing Logs

These logs mirror the seeded sample dataset and show the expected branch-specific outputs for an operations reviewer.

## Complaint

- Input: Charged twice for my invoice
- Classification: `complaint`
- Urgency: `high`
- Assigned team: Customer Recovery
- Status: `escalated`
- Actions triggered:
  - Acknowledge complaint
  - Escalate to senior handler
  - Create priority case log
  - Set 2-hour follow-up

## General Enquiry

- Input: Question about available billing plans
- Classification: `general_enquiry`
- Urgency: `low`
- Assigned team: Knowledge Operations
- Status: `resolved`
- Actions triggered:
  - Classify enquiry sub-topic
  - Generate knowledge response
  - Mark as resolved

## Service Request

- Input: Please activate service for new location
- Classification: `service_request`
- Urgency: `medium`
- Assigned team: Service Fulfillment
- Status: `in_progress`
- Actions triggered:
  - Extract required details
  - Route to department
  - Generate confirmation
  - Set SLA timer

## Escalation / Urgent

- Input: Urgent suspected fraud on account
- Classification: `escalation_urgent`
- Urgency: `critical`
- Assigned team: Supervisor Desk
- Status: `human_review`
- Actions triggered:
  - Flag for human review
  - Draft urgent acknowledgement
  - Notify supervisor
  - Pause auto-resolution
