// Premium Dashboard Page
// Replace frontend/src/pages/dashboard.tsx with this file.

import { AlertTriangle, CheckCircle2, Gauge, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";
import { formatDate, labelize } from "../lib/utils";
import type { DashboardMetrics } from "../types/api";

export function DashboardPage() {
 const [metrics,setMetrics]=useState<DashboardMetrics|null>(null);
 useEffect(()=>{api.dashboard().then(setMetrics).catch(console.error)},[]);
 if(!metrics) return <div className="flex h-72 items-center justify-center text-slate-500">Loading dashboard...</div>;

 const cards=[
 {label:"Total Requests",value:metrics.total_requests,icon:Inbox,color:"text-blue-600",bg:"bg-blue-100",trend:"+12% Today"},
 {label:"Active Work",value:metrics.open_requests,icon:Gauge,color:"text-emerald-600",bg:"bg-emerald-100",trend:"In Progress"},
 {label:"Critical",value:metrics.critical_requests,icon:AlertTriangle,color:"text-red-600",bg:"bg-red-100",trend:"Immediate"},
 {label:"AI Confidence",value:`${Math.round(metrics.avg_confidence*100)}%`,icon:CheckCircle2,color:"text-violet-600",bg:"bg-violet-100",trend:"Average"},
 ];

 return (
 <div className="space-y-8">
 <div><h1 className="text-3xl font-bold text-slate-800">Operations Dashboard</h1><p className="text-slate-500 mt-1">Real-time overview of incoming requests and workflow execution.</p></div>
 <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
 {cards.map(c=>(
 <Card key={c.label} className="rounded-2xl shadow-sm hover:shadow-lg transition">
 <CardContent className="flex items-center justify-between p-6">
 <div><p className="text-sm text-slate-500">{c.label}</p><h2 className="mt-2 text-4xl font-bold">{c.value}</h2><span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs">{c.trend}</span></div>
 <div className={`${c.bg} rounded-xl p-4`}><c.icon className={`${c.color} h-8 w-8`} /></div>
 </CardContent></Card>))}
 </div>

 <div className="grid gap-6 lg:grid-cols-2">
 <Card><CardHeader><CardTitle>Requests by Type</CardTitle></CardHeader><CardContent className="space-y-5">{metrics.by_type.map(r=><MetricBar key={r.name} label={labelize(r.name)} value={r.value} total={metrics.total_requests}/>)}</CardContent></Card>
 <Card><CardHeader><CardTitle>Status Overview</CardTitle></CardHeader><CardContent className="space-y-5">{metrics.by_status.map(r=><MetricBar key={r.name} label={labelize(r.name)} value={r.value} total={metrics.total_requests}/>)}</CardContent></Card>
 </div>

 <Card><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent className="space-y-4">{metrics.recent_activity.map(log=><div key={log.id} className="flex gap-4 rounded-xl border p-4 hover:bg-slate-50"><div className="mt-1 h-3 w-3 rounded-full bg-blue-600"/><div className="flex-1"><h4 className="font-semibold">{labelize(log.event_type)}</h4><p className="text-sm text-slate-600">{log.message}</p></div><div className="text-xs text-slate-500">{formatDate(log.created_at)}</div></div>)}</CardContent></Card>
 </div>);
}

function MetricBar({label,value,total}:{label:string;value:number;total:number;}){
 const percent=total?Math.round(value/total*100):0;
 return <div><div className="mb-2 flex justify-between text-sm"><span className="font-medium">{label}</span><span>{value} ({percent}%)</span></div><div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-blue-600 transition-all duration-700" style={{width:`${percent}%`}}/></div></div>;
}
