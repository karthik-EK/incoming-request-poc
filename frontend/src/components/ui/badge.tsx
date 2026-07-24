import { cn } from "../../lib/utils";

const tones: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-800 ring-amber-200",
  high: "bg-orange-50 text-orange-800 ring-orange-200",
  critical: "bg-red-50 text-red-700 ring-red-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  escalated: "bg-orange-50 text-orange-800 ring-orange-200",
  human_review: "bg-red-50 text-red-700 ring-red-200",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-200"
};

export function Badge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium ring-1", tones[value] ?? "bg-slate-50 text-slate-700 ring-slate-200", className)}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
