import { Send, UploadCloud } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { api } from "../lib/api";
import type { TicketCreate } from "../types/api";

const initial: TicketCreate = {
  subject: "",
  requester_name: "",
  requester_email: "",
  channel: "web_form",
  description: ""
};

export function SubmitRequestPage() {
  const [form, setForm] = useState<TicketCreate>(initial);
  const [batchText, setBatchText] = useState("");
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submitSingle(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const ticket = await api.createTicket(form);
      navigate(`/requests/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request");
    }
  }

  async function submitBatch(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const requests = JSON.parse(batchText) as TicketCreate[];
      const tickets = await api.createBatch(requests);
      navigate(`/requests/${tickets[0].id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch JSON could not be processed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold">Submit Request</h1>
        <p className="text-sm text-muted-foreground">New requests are classified and routed immediately.</p>
      </div>

      <div className="grid w-full grid-cols-2 rounded-md border bg-card p-1 sm:inline-grid sm:w-auto">
        <button className={mode === "single" ? "rounded bg-primary px-3 py-1.5 text-sm text-white" : "px-3 py-1.5 text-sm"} onClick={() => setMode("single")}>
          Single
        </button>
        <button className={mode === "batch" ? "rounded bg-primary px-3 py-1.5 text-sm text-white" : "px-3 py-1.5 text-sm"} onClick={() => setMode("batch")}>
          Batch
        </button>
      </div>

      {mode === "single" ? (
        <Card>
          <CardHeader>
            <CardTitle>Request Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitSingle}>
              <Input required placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
              <Input required placeholder="Requester name" value={form.requester_name} onChange={(event) => setForm({ ...form, requester_name: event.target.value })} />
              <Input required type="email" placeholder="Requester email" value={form.requester_email} onChange={(event) => setForm({ ...form, requester_email: event.target.value })} />
              <Select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} aria-label="Channel">
                <option value="web_form">Web Form</option>
                <option value="email">Email</option>
                <option value="shared_inbox">Shared Inbox</option>
              </Select>
              <Textarea
                required
                className="md:col-span-2"
                placeholder="Request details"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
              {error && <div className="md:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="md:col-span-2">
                <Button className="w-full sm:w-auto" type="submit">
                  <Send className="h-4 w-4" />
                  Process
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Batch Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitBatch}>
              <Textarea
                className="min-h-72 overflow-x-auto font-mono text-xs sm:text-sm"
                placeholder='[{"subject":"Urgent account issue","requester_name":"Ava","requester_email":"ava@example.com","channel":"email","description":"Urgent supervisor review needed."}]'
                value={batchText}
                onChange={(event) => setBatchText(event.target.value)}
              />
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <Button className="w-full sm:w-auto" type="submit" variant="secondary">
                <UploadCloud className="h-4 w-4" />
                Process Batch
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
