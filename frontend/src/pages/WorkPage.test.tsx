import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { WorkPage } from "@/pages/WorkPage";

describe("WorkPage", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("muestra únicamente los trabajos asignados recibidos del backend", async () => {
    sessionStorage.setItem("citylife.accessToken", "technician-token");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes("/api/users/me")
        ? { id: "technician-id", email: "technician@example.com", displayName: "Technician", role: "TECHNICIAN" }
        : [{
            id: "incident-id",
            title: "Baldosa suelta",
            description: "La baldosa supone un riesgo",
            category: { id: "category-id", code: "ROADS", name: "Vía pública" },
            status: "ASSIGNED",
            priority: "HIGH",
            address: "Calle Mayor, 1",
            district: "Centro",
            createdBy: { id: "citizen-id", displayName: "Citizen", email: "citizen@example.com", role: "CITIZEN" },
            department: { id: "department-id", code: "PUBLIC_WORKS", name: "Obras y vía pública" },
            assignedTo: { id: "technician-id", displayName: "Technician", email: "technician@example.com", role: "TECHNICIAN" },
            createdAt: "2026-11-01T18:00:00Z",
            updatedAt: "2026-11-01T18:00:00Z",
          }];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider><WorkPage /></AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Baldosa suelta")).toBeInTheDocument();
    expect(screen.getByText("1 trabajo activo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir trabajo/ })).toHaveAttribute("href", "/work/incident-id");
  });
});
