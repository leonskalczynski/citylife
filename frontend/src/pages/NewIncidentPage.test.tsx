import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { NewIncidentPage } from "@/pages/NewIncidentPage";

describe("NewIncidentPage", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("valida los campos obligatorios antes de enviar", async () => {
    sessionStorage.setItem("citylife.accessToken", "test-token");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes("/api/categories")
        ? [{ id: "11111111-1111-1111-1111-111111111111", code: "LIGHTING", name: "Alumbrado" }]
        : { id: "user-id", email: "citizen@example.com", displayName: "Citizen", role: "CITIZEN" };
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider><NewIncidentPage /></AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reportar incidencia" }));

    expect(await screen.findByText("El título debe tener al menos 5 caracteres")).toBeInTheDocument();
    expect(screen.getByText("La descripción debe tener al menos 10 caracteres")).toBeInTheDocument();
    expect(screen.getAllByText("Selecciona una categoría")).toHaveLength(2);
  });
});
