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

  it("evita repetir la dirección cuando no hay un mapa que mostrar", () => {
    const { container } = render(<IncidentLocationCard incident={{ ...incident, latitude: null, longitude: null }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el mapa sin exponer coordenadas técnicas", () => {
    render(<IncidentLocationCard incident={{ ...incident, latitude: 40.41691, longitude: -3.70352 }} />);
    expect(screen.getByLabelText("Mapa de Farola apagada")).toBeInTheDocument();
    expect(screen.queryByText("40.41691, -3.70352")).not.toBeInTheDocument();
    expect(screen.getByText("Plaza Mayor, 3 · Centro")).toBeInTheDocument();
  });
});
