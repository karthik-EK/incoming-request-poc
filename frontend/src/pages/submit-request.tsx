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

const initialForm: TicketCreate = {
  subject: "",
  requester_name: "",
  requester_email: "",
  channel: "web_form",
  description: "",
};

export function SubmitRequestPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"single" | "batch">("single");
  const [form, setForm] = useState<TicketCreate>(initialForm);
  const [batchText, setBatchText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitSingle(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const ticket = await api.createTicket(form);
      navigate(`/requests/${ticket.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit request."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitBatch(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const requests = JSON.parse(batchText) as TicketCreate[];

      const tickets = await api.createBatch(requests);

      if (tickets.length > 0) {
        navigate(`/requests/${tickets[0].id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid batch JSON."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Submit Request
        </h1>

        <p className="text-sm text-muted-foreground">
          Submit a request for AI classification and workflow processing.
        </p>
      </div>

      {/* Toggle */}

      <div className="inline-flex rounded-lg border p-1">

        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded-md text-sm ${
            mode === "single"
              ? "bg-primary text-white"
              : "hover:bg-muted"
          }`}
        >
          Single Request
        </button>

        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`px-4 py-2 rounded-md text-sm ${
            mode === "batch"
              ? "bg-primary text-white"
              : "hover:bg-muted"
          }`}
        >
          Batch Upload
        </button>

      </div>

      {mode === "single" ? (
        <Card>

          <CardHeader>
            <CardTitle>Request Intake Form</CardTitle>
          </CardHeader>

          <CardContent>

            <form
              onSubmit={submitSingle}
              className="grid gap-4 md:grid-cols-2"
            >

              <Input
                required
                placeholder="Subject"
                value={form.subject}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subject: e.target.value,
                  })
                }
              />

              <Input
                required
                placeholder="Requester Name"
                value={form.requester_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    requester_name: e.target.value,
                  })
                }
              />

              <Input
                required
                type="email"
                placeholder="Requester Email"
                value={form.requester_email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    requester_email: e.target.value,
                  })
                }
              />

              <Select
                value={form.channel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    channel: e.target.value,
                  })
                }
              >
                <option value="web_form">Web Form</option>
                <option value="email">Email</option>
                <option value="shared_inbox">Shared Inbox</option>
              </Select>

              <Textarea
                required
                className="md:col-span-2"
                placeholder="Describe the request..."
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              {error && (
                <div className="md:col-span-2 rounded-md bg-red-100 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="md:col-span-2">

                <Button
                  type="submit"
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />

                  {loading
                    ? "Submitting..."
                    : "Submit Request"}
                </Button>

              </div>

            </form>

          </CardContent>

        </Card>
      ) : (
        <Card>

          <CardHeader>
            <CardTitle>Batch Request Upload</CardTitle>
          </CardHeader>

          <CardContent>

            <form
              onSubmit={submitBatch}
              className="space-y-4"
            >

              <Textarea
                className="min-h-72 font-mono text-sm"
                placeholder='[
  {
    "subject":"Login Issue",
    "requester_name":"John",
    "requester_email":"john@example.com",
    "channel":"email",
    "description":"Cannot login to account"
  }
]'
                value={batchText}
                onChange={(e) =>
                  setBatchText(e.target.value)
                }
              />

              {error && (
                <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="secondary"
                disabled={loading}
              >
                <UploadCloud className="mr-2 h-4 w-4" />

                {loading
                  ? "Submitting..."
                  : "Submit Batch"}
              </Button>

            </form>

          </CardContent>

        </Card>
      )}

    </div>
  );
}