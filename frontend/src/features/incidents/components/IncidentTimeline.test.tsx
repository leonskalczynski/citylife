import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IncidentTimeline } from "@/features/incidents/components/IncidentTimeline";

describe("IncidentTimeline", () => {
  it("muestra los cambios en orden con actor y motivo", () => {
    render(<IncidentTimeline isLoading={false} isError={false} changes={[
      {
        id: "first",
        newStatus: "REPORTED",
        changedBy: { id: "citizen", displayName: "Ana", role: "CITIZEN" },
        changedAt: "2026-11-01T10:00:00Z",
      },
      {
        id: "second",
        previousStatus: "REPORTED",
        newStatus: "REJECTED",
        changedBy: { id: "operator", displayName: "Operación centro", role: "OPERATOR" },
        reason: "La incidencia está duplicada",
        changedAt: "2026-11-01T11:00:00Z",
      },
    ]} />);

    expect(screen.getByText("Incidencia reportada")).toBeInTheDocument();
    expect(screen.getByText("Incidencia rechazada")).toBeInTheDocument();
    expect(screen.getByText("Operación centro · Operación")).toBeInTheDocument();
    expect(screen.getByText("La incidencia está duplicada")).toBeInTheDocument();
  });
});
