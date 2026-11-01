import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { OperationsIncidentsPage } from "@/pages/OperationsIncidentsPage";

describe("OperationsIncidentsPage", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("muestra la bandeja paginada recibida del backend", async () => {
    sessionStorage.setItem("citylife.accessToken", "operator-token");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      let body: unknown;
      if (url.includes("/api/users/me")) {
        body = { id: "operator-id", email: "operator@example.com", displayName: "Operator", role: "OPERATOR" };
      } else if (url.includes("/api/categories") || url.includes("/api/departments")) {
        body = [];
      } else {
        body = {
          content: [{
            id: "incident-id",
            title: "Farola apagada",
            description: "La farola no funciona",
            category: { id: "category-id", code: "LIGHTING", name: "Alumbrado" },
            status: "REPORTED",
            priority: "NORMAL",
            district: "Centro",
            createdBy: { id: "citizen-id", displayName: "Citizen", email: "citizen@example.com", role: "CITIZEN" },
            createdAt: "2026-11-01T18:00:00Z",
            updatedAt: "2026-11-01T18:00:00Z",
          }],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        };
      }
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider><OperationsIncidentsPage /></AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Farola apagada")).toBeInTheDocument();
    expect(screen.getByText("1 incidencias")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar" })).toHaveAttribute("href", "/operations/incidents/incident-id");

    fireEvent.click(screen.getByRole("button", { name: "Mapa" }));
    expect(await screen.findByText("Las incidencias de esta página no tienen coordenadas.")).toBeInTheDocument();
  });
});
