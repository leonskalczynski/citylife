import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IncidentLocationCard } from "@/features/incidents/components/IncidentLocationCard";
import type { Incident } from "@/features/incidents/types";

vi.mock("@/features/incidents/components/IncidentMap", () => ({
  IncidentMap: ({ ariaLabel }: { ariaLabel: string }) => <div aria-label={ariaLabel} />,
}));

const incident: Incident = {
  id: "incident-id",
  title: "Farola apagada",
  description: "La farola no funciona",
  category: { id: "category-id", code: "LIGHTING", name: "Alumbrado" },
  status: "REPORTED",
  priority: "NORMAL",
  address: "Plaza Mayor, 3",
  district: "Centro",
  createdBy: { id: "citizen-id", displayName: "Citizen", email: "citizen@example.com", role: "CITIZEN" },
  createdAt: "2026-11-01T18:00:00Z",
  updatedAt: "2026-11-01T18:00:00Z",
};

describe("IncidentLocationCard", () => {
  afterEach(cleanup);

  it("explica cuándo la incidencia no tiene ubicación", () => {
    render(<IncidentLocationCard incident={{ ...incident, latitude: null, longitude: null }} />);
    expect(screen.getByText("Esta incidencia no tiene una posición marcada en el mapa.")).toBeInTheDocument();
  });

  it("muestra el mapa y las coordenadas cuando existen", () => {
    render(<IncidentLocationCard incident={{ ...incident, latitude: 40.41691, longitude: -3.70352 }} />);
    expect(screen.getByLabelText("Mapa de Farola apagada")).toBeInTheDocument();
    expect(screen.getByText("40.41691, -3.70352")).toBeInTheDocument();
    expect(screen.getByText("Plaza Mayor, 3 · Centro")).toBeInTheDocument();
  });
});
