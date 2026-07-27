import { BarChart3, ClipboardList, FilePlus2, History } from "lucide-react";
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

import { cn } from "../../lib/utils";

const nav = [
  {
    to: "/",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    to: "/requests",
    label: "Tickets",
    icon: ClipboardList,
  },
  {
    to: "/requests/new",
    label: "Submit",
    icon: FilePlus2,
  },
  {
    to: "/audit",
    label: "Audit Logs",
    icon: History,
  },
];

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const isActive = (path: string) => {
    // Dashboard
    if (path === "/") {
      return location.pathname === "/";
    }

    // Tickets list + ticket details
    if (path === "/requests") {
      return (
        location.pathname === "/requests" ||
        /^\/requests\/\d+$/.test(location.pathname)
      );
    }

    // Submit page
    if (path === "/requests/new") {
      return location.pathname === "/requests/new";
    }

    // Audit
    if (path === "/audit") {
      return location.pathname === "/audit";
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
        <div className="border-b px-5 py-4">
          <div className="text-lg font-semibold text-primary">
            RequestOps
          </div>

          <div className="text-xs text-muted-foreground">
            Workflow Console
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive(item.to) &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />

              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur sm:px-5 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 lg:max-w-none">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold sm:text-base">
                Incoming Request Processing Workflow
              </div>

              <div className="truncate text-xs text-muted-foreground">
                AI classification, branch execution, auditability
              </div>
            </div>

            <div className="hidden text-xs text-muted-foreground sm:block">
              SQLite-backed POC
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-3 py-4 pb-24 sm:px-5 md:px-6 lg:max-w-none lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 px-2 py-2 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground",
                  isActive(item.to) &&
                    "bg-primary text-primary-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />

              <span className="max-w-full truncate">
                {item.label.replace("Audit Logs", "Audit")}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}