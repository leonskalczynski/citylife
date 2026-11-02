import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/components/AuthProvider";
import type { Dashboard } from "@/features/dashboard/types";
import { DashboardPage } from "@/pages/DashboardPage";

const baseDashboard: Dashboard = {
  scope: "OPERATOR",
  totalIncidents: 10,
  byStatus: [
    { key: "REPORTED", count: 2 },
    { key: "VALIDATED", count: 1 },
    { key: "REJECTED", count: 1 },
    { key: "ASSIGNED", count: 2 },
    { key: "IN_PROGRESS", count: 1 },
    { key: "RESOLVED", count: 3 },
    { key: "REOPENED", count: 0 },
    { key: "CLOSED", count: 0 },
  ],
  byCategory: [
    { id: "lighting", name: "Alumbrado", count: 6 },
    { id: "roads", name: "Vía pública", count: 4 },
  ],
  byPriority: [
    { key: "LOW", count: 0 },
    { key: "NORMAL", count: 7 },
    { key: "HIGH", count: 2 },
    { key: "URGENT", count: 1 },
  ],
  resolution: { sampleSize: 3, minimumSamples: 3, averageSeconds: 32400 },
  indicators: {
    awaitingValidation: 2,
    awaitingAssignment: 1,
    awaitingStart: 2,
    inProgress: 1,
    activeWork: 3,
    urgentOpen: 1,
    resolved: 3,
    rejected: 1,
    assignedWithoutTechnician: 1,
  },
  pulse: {
    activeIncidents: 6,
    createdToday: 1,
    resolvedToday: 1,
    createdLast7Days: 5,
    resolvedLast7Days: 4,
    createdPrevious7Days: 3,
    resolvedPrevious7Days: 2,
    activity: [
      { date: "2026-10-26", created: 0, resolved: 0 },
      { date: "2026-10-27", created: 1, resolved: 1 },
      { date: "2026-10-28", created: 0, resolved: 0 },
      { date: "2026-10-29", created: 1, resolved: 1 },
      { date: "2026-10-30", created: 1, resolved: 1 },
      { date: "2026-10-31", created: 1, resolved: 0 },
      { date: "2026-11-01", created: 1, resolved: 1 },
    ],
    recentEvents: [],
    byDistrict: [
      { district: "Centro", count: 6 },
      { district: "Norte", count: 4 },
    ],
    mapPoints: [],
  },
};

describe("DashboardPage", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("muestra totales, desgloses y tiempo medio para operación", async () => {
    sessionStorage.setItem("citylife.accessToken", "operator-token");
    mockApi("OPERATOR", baseDashboard);

    renderDashboard();

    expect(await screen.findByText("incidencias activas")).toBeInTheDocument();
    expect(await screen.findByText("Así está la ciudad hoy.")).toBeInTheDocument();
    expect(screen.getByText("Pendientes de validar")).toBeInTheDocument();
    expect(screen.getByText("Urgentes abiertas")).toBeInTheDocument();
    expect(screen.getByText("9 h")).toBeInTheDocument();
    expect(screen.getByText("Alumbrado")).toBeInTheDocument();
    expect(screen.getByText("Sin técnico")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir bandeja/ })).toHaveAttribute("href", "/operations/incidents");
    expect(screen.getByRole("link", { name: /Pendientes de validar/ })).toHaveAttribute("href", "/operations/incidents?status=REPORTED");
  });

  it("adapta los indicadores al técnico sin análisis operativos irrelevantes", async () => {
    sessionStorage.setItem("citylife.accessToken", "technician-token");
    mockApi("TECHNICIAN", {
      ...baseDashboard,
      scope: "TECHNICIAN",
      totalIncidents: 4,
      resolution: { sampleSize: 2, minimumSamples: 3, averageSeconds: null },
    });

    renderDashboard();

    expect(await screen.findByText("incidencias activas")).toBeInTheDocument();
    expect(await screen.findByText("Tu jornada de campo, de un vistazo.")).toBeInTheDocument();
    expect(screen.getByText("Por iniciar")).toBeInTheDocument();
    expect(screen.getByText("Intervenciones abiertas ahora")).toBeInTheDocument();
    expect(screen.queryByText("Aún no hay datos suficientes")).not.toBeInTheDocument();
    expect(screen.queryByText(/2 de 3 resoluciones necesarias/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver mis trabajos/ })).toHaveAttribute("href", "/work");
  });
});

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app"]}>
        <AuthProvider><DashboardPage /></AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockApi(role: "OPERATOR" | "TECHNICIAN", dashboard: Dashboard) {
  const user = {
    id: `${role.toLowerCase()}-id`,
    email: `${role.toLowerCase()}@example.com`,
    displayName: role === "OPERATOR" ? "Operator" : "Technician",
    role,
  };
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes("/api/users/me") ? user : dashboard;
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  }));
}
