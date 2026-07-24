import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, Td, Th } from "../components/ui/table";
import { api } from "../lib/api";
import { formatDate, labelize } from "../lib/utils";
import type { AuditLog } from "../types/api";

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.auditLogs().then(setLogs).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Classification decisions, workflow execution, and human overrides.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Processing Log</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 lg:hidden">
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">{labelize(log.event_type)}</div>
                <div className="text-xs text-muted-foreground">{formatDate(log.created_at)}</div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{log.actor}</div>
              <div className="mt-2 break-words text-sm">{log.message}</div>
              <div className="mt-2 text-sm">
                {log.ticket_id ? <Link className="text-primary hover:underline" to={`/requests/${log.ticket_id}`}>Ticket #{log.ticket_id}</Link> : "System"}
              </div>
            </div>
          ))}
        </CardContent>
        <CardContent className="hidden overflow-x-auto p-0 lg:block">
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Event</Th>
                <Th>Ticket</Th>
                <Th>Actor</Th>
                <Th>Message</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/60">
                  <Td>{formatDate(log.created_at)}</Td>
                  <Td>{labelize(log.event_type)}</Td>
                  <Td>{log.ticket_id ? <Link className="text-primary hover:underline" to={`/requests/${log.ticket_id}`}>#{log.ticket_id}</Link> : "System"}</Td>
                  <Td>{log.actor}</Td>
                  <Td className="break-words">{log.message}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
