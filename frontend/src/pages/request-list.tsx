import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Table, Td, Th } from "../components/ui/table";
import { api } from "../lib/api";
import { formatDate, labelize } from "../lib/utils";
import type { Ticket } from "../types/api";

export function RequestListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("");
  const [urgency, setUrgency] = useState("");
  const [status, setStatus] = useState("");

  const params = useMemo(() => {
    const next = new URLSearchParams();

    if (search) next.set("search", search);
    if (classification) next.set("classification", classification);
    if (urgency) next.set("urgency", urgency);
    if (status) next.set("status", status);

    return next;
  }, [search, classification, urgency, status]);

  // DEBUG
  console.log("STATE =>", {
    search,
    classification,
    urgency,
    status,
  });

  useEffect(() => {
    console.log("Request URL =>", `/api/requests?${params.toString()}`);

    api
      .tickets(params)
      .then((data) => {
        console.log("Returned tickets:", data);
        setTickets(data);
      })
      .catch(console.error);
  }, [params]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Ticket Queue</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} matching requests
          </p>
        </div>

        <Button
          className="w-full sm:w-auto"
          variant="outline"
          onClick={() => window.open(api.exportUrl, "_blank")}
        >
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_180px_160px_180px]">

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tickets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            value={classification}
            onChange={(e) => {
              console.log("Classification changed:", e.target.value);
              setClassification(e.target.value);
            }}
            aria-label="Classification filter"
          >
            <option value="">All types</option>
            <option value="complaint">Complaint</option>
            <option value="general_enquiry">General Enquiry</option>
            <option value="service_request">Service Request</option>
            <option value="escalation_urgent">Escalation / Urgent</option>
          </Select>

          <Select
            value={urgency}
            onChange={(e) => {
              console.log("Urgency changed:", e.target.value);
              setUrgency(e.target.value);
            }}
            aria-label="Urgency filter"
          >
            <option value="">All urgency</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>

          <Select
            value={status}
            onChange={(e) => {
              console.log("Status changed:", e.target.value);
              setStatus(e.target.value);
            }}
            aria-label="Status filter"
          >
            <option value="">All status</option>
            <option value="resolved">Resolved</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="human_review">Human Review</option>
          </Select>

        </CardContent>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/requests/${ticket.id}`}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words text-sm font-semibold text-primary">
                  {ticket.subject}
                </div>
                <div className="mt-1 break-all text-xs text-muted-foreground">
                  {ticket.requester_email}
                </div>
              </div>

              <Badge value={ticket.urgency} className="shrink-0" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge value={ticket.classification} />
              <Badge value={ticket.status} />
            </div>

            <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <span>Team: {ticket.assigned_team}</span>
              <span>Created: {formatDate(ticket.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>

        <CardContent className="hidden overflow-x-auto p-0 lg:block">
          <Table>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Type</Th>
                <Th>Urgency</Th>
                <Th>Status</Th>
                <Th>Team</Th>
                <Th>Created</Th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-muted/60">
                  <Td>
                    <Link
                      className="font-medium text-primary hover:underline"
                      to={`/requests/${ticket.id}`}
                    >
                      {ticket.subject}
                    </Link>

                    <div className="mt-1 break-all text-xs text-muted-foreground">
                      {ticket.requester_email}
                    </div>
                  </Td>

                  <Td>{labelize(ticket.classification)}</Td>

                  <Td>
                    <Badge value={ticket.urgency} />
                  </Td>

                  <Td>
                    <Badge value={ticket.status} />
                  </Td>

                  <Td>{ticket.assigned_team}</Td>

                  <Td>{formatDate(ticket.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}