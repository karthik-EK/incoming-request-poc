import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function labelize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  let date = new Date(value);

  // If backend sends datetime without timezone,
  // treat it as UTC.
  if (isNaN(date.getTime())) {
    date = new Date(value + "Z");
  }

  if (isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}