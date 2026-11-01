import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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
};

describe("DashboardPage", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("muestra totales, desgloses y tiempo medio para operación", async () => {
    sessionStorage.setItem("citylife.accessToken", "operator-token");
    mockApi("OPERATOR", baseDashboard);

    renderDashboard();

    expect(await screen.findByText("Incidencias registradas")).toBeInTheDocument();
    expect(screen.getByText("Resumen de la operación")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Pendientes de validar")).toBeInTheDocument();
    expect(screen.getByText("Urgentes abiertas")).toBeInTheDocument();
    expect(screen.getByText("9 h")).toBeInTheDocument();
    expect(screen.getByText("Alumbrado")).toBeInTheDocument();
    expect(screen.getByText("Sin técnico")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir bandeja/ })).toHaveAttribute("href", "/operations/incidents");
  });

  it("adapta los indicadores al técnico y explica cuándo faltan muestras", async () => {
    sessionStorage.setItem("citylife.accessToken", "technician-token");
    mockApi("TECHNICIAN", {
      ...baseDashboard,
      scope: "TECHNICIAN",
      totalIncidents: 4,
      resolution: { sampleSize: 2, minimumSamples: 3, averageSeconds: null },
    });

    renderDashboard();

    expect(await screen.findByText("Trabajos asignados")).toBeInTheDocument();
    expect(screen.getByText("Tu carga de trabajo")).toBeInTheDocument();
    expect(screen.getByText("Por iniciar")).toBeInTheDocument();
    expect(screen.getByText("Carga activa")).toBeInTheDocument();
    expect(screen.getByText("Aún no hay datos suficientes")).toBeInTheDocument();
    expect(screen.getByText(/2 de 3 resoluciones necesarias/)).toBeInTheDocument();
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
