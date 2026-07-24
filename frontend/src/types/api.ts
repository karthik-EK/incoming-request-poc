export type WorkflowAction = {
  id: number;
  sequence: number;
  name: string;
  status: string;
  output: string;
  created_at: string;
};

export type AuditLog = {
  id: number;
  ticket_id: number | null;
  event_type: string;
  actor: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Ticket = {
  id: number;
  subject: string;
  requester_name: string;
  requester_email: string;
  channel: string;
  description: string;
  classification: string;
  urgency: string;
  confidence: number;
  status: string;
  assigned_team: string;
  draft_response: string;
  action_summary: string;
  ai_rationale: string;
  subtopic: string;
  follow_up_at: string | null;
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
  actions: WorkflowAction[];
  audit_logs: AuditLog[];
};

export type TicketCreate = Pick<Ticket, "subject" | "requester_name" | "requester_email" | "channel" | "description">;

export type DashboardMetrics = {
  total_requests: number;
  open_requests: number;
  critical_requests: number;
  avg_confidence: number;
  by_type: { name: string; value: number }[];
  by_status: { name: string; value: number }[];
  recent_activity: AuditLog[];
};
