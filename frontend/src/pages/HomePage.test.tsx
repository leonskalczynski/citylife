import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { HomePage } from "@/pages/HomePage";

describe("HomePage", () => {
  it("presenta el propósito de Citylife y una entrada directa al registro", () => {
    render(<BrowserRouter><HomePage /></BrowserRouter>);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Una ciudad mejor");
    expect(screen.getByRole("link", { name: /Crear cuenta/ })).toHaveAttribute("href", "/register");
    expect(screen.queryByText("Citylife API conectada")).not.toBeInTheDocument();
  });
});

