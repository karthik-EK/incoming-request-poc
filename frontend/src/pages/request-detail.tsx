import { ArrowLeft, GitBranch, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { api } from "../lib/api";
import { formatDate, labelize } from "../lib/utils";
import type { Ticket } from "../types/api";

export function RequestDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [classification, setClassification] = useState("");
  const [urgency, setUrgency] = useState("");
  const [note, setNote] = useState("Operations lead override after review.");

  useEffect(() => {
    if (id) api.ticket(id).then((data) => {
      setTicket(data);
      setClassification(data.classification);
      setUrgency(data.urgency);
    });
  }, [id]);

  async function override() {
    if (!ticket) return;
    const updated = await api.overrideTicket(ticket.id, { classification, urgency, note });
    setTicket(updated);
  }

  if (!ticket) return <div className="text-sm text-muted-foreground">Loading ticket...</div>;

  return (
    <div className="space-y-4">
      <Link to="/requests" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Tickets
      </Link>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <CardTitle className="break-words">{ticket.subject}</CardTitle>
                <div className="mt-1 break-all text-sm text-muted-foreground">
                  {ticket.requester_name} - {ticket.requester_email}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                <Badge value={ticket.classification} />
                <Badge value={ticket.urgency} />
                <Badge value={ticket.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Original Request</div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{ticket.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Assigned Team" value={ticket.assigned_team} />
                <Info label="Follow Up" value={formatDate(ticket.follow_up_at)} />
                <Info label="SLA Due" value={formatDate(ticket.sla_due_at)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="break-words rounded-md border bg-muted/50 p-4 text-sm leading-6">{ticket.draft_response}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.actions.map((action) => (
                <div key={action.id} className="grid gap-3 border-l-2 border-secondary pl-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <GitBranch className="h-4 w-4 shrink-0 text-secondary" />
                      <span className="break-words">{action.sequence}. {action.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatDate(action.created_at)}</div>
                  </div>
                  <div className="break-words text-sm text-muted-foreground">{action.output}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Info label="Confidence" value={`${Math.round(ticket.confidence * 100)}%`} />
              <Info label="Sub-topic" value={ticket.subtopic} />
              <Info label="Rationale" value={ticket.ai_rationale} />
              <Info label="Action Summary" value={ticket.action_summary} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Override</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={classification} onChange={(event) => setClassification(event.target.value)} aria-label="Override classification">
                <option value="complaint">Complaint</option>
                <option value="general_enquiry">General Enquiry</option>
                <option value="service_request">Service Request</option>
                <option value="escalation_urgent">Escalation / Urgent</option>
              </Select>
              <Select value={urgency} onChange={(event) => setUrgency(event.target.value)} aria-label="Override urgency">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
              <Button className="w-full sm:w-auto" variant="outline" onClick={override}>
                <ShieldCheck className="h-4 w-4" />
                Apply
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm">{value}</div>
    </div>
  );
}
