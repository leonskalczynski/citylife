import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { LoginPage } from "@/pages/LoginPage";

describe("LoginPage", () => {
  it("muestra errores al enviar campos vacíos", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Acceder" }));

    expect(await screen.findByText("Introduce un email válido")).toBeInTheDocument();
    expect(await screen.findByText("Introduce tu contraseña")).toBeInTheDocument();
  });
});
