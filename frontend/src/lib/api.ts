import type { AuditLog, DashboardMetrics, Ticket, TicketCreate } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardMetrics>("/api/dashboard"),
  tickets: (params: URLSearchParams) => request<Ticket[]>(`/api/requests?${params.toString()}`),
  ticket: (id: string) => request<Ticket>(`/api/requests/${id}`),
  createTicket: (payload: TicketCreate) =>
    request<Ticket>("/api/requests", { method: "POST", body: JSON.stringify(payload) }),
  createBatch: (requests: TicketCreate[]) =>
    request<Ticket[]>("/api/requests/batch", { method: "POST", body: JSON.stringify({ requests }) }),
  overrideTicket: (id: number, payload: { classification?: string; urgency?: string; status?: string; note: string }) =>
    request<Ticket>(`/api/requests/${id}/override`, { method: "POST", body: JSON.stringify(payload) }),
  auditLogs: () => request<AuditLog[]>("/api/audit-logs"),
  exportUrl: `${API_BASE_URL}/api/export.csv`
};
