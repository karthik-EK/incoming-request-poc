import { AlertTriangle, CheckCircle2, Gauge, Inbox } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";
import { formatDate, labelize } from "../lib/utils";
import type { DashboardMetrics } from "../types/api";

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    api.dashboard().then(setMetrics).catch(console.error);
  }, []);

  if (!metrics) return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;

  const cards = [
    { label: "Total Requests", value: metrics.total_requests, icon: Inbox },
    { label: "Active Work", value: metrics.open_requests, icon: Gauge },
    { label: "Critical", value: metrics.critical_requests, icon: AlertTriangle },
    { label: "Avg Confidence", value: `${Math.round(metrics.avg_confidence * 100)}%`, icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase text-muted-foreground">{item.label}</div>
                <div className="mt-2 text-3xl font-semibold">{item.value}</div>
              </div>
              <item.icon className="h-8 w-8 shrink-0 text-secondary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volume By Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.by_type.map((row) => (
              <MetricBar key={row.name} label={labelize(row.name)} value={row.value} total={metrics.total_requests} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.by_status.map((row) => (
              <MetricBar key={row.name} label={labelize(row.name)} value={row.value} total={metrics.total_requests} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {metrics.recent_activity.map((log) => (
            <div key={log.id} className="grid gap-2 px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)_160px]">
              <div className="text-sm font-medium">{labelize(log.event_type)}</div>
              <div className="break-words text-sm text-muted-foreground">{log.message}</div>
              <div className="text-xs text-muted-foreground md:text-right">{formatDate(log.created_at)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total > 0 ? Math.max(8, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded bg-muted">
        <div className="h-2 rounded bg-secondary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
