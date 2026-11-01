import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomePage } from "@/pages/HomePage";

describe("HomePage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("presenta el propósito de Citylife", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ application: "Citylife", status: "UP" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<BrowserRouter><HomePage /></BrowserRouter>);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Una ciudad mejor");
    expect(await screen.findByText("Citylife API conectada")).toBeInTheDocument();
  });
});

