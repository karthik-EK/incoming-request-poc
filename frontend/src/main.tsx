import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/app-shell";
import "./index.css";
import { AuditPage } from "./pages/audit";
import { DashboardPage } from "./pages/dashboard";
import { RequestDetailPage } from "./pages/request-detail";
import { RequestListPage } from "./pages/request-list";
import { SubmitRequestPage } from "./pages/submit-request";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestListPage />} />
          <Route path="/requests/new" element={<SubmitRequestPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </React.StrictMode>
);
