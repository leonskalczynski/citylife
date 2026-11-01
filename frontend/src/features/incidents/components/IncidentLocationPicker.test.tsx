import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IncidentLocationPicker } from "@/features/incidents/components/IncidentLocationPicker";

describe("IncidentLocationPicker", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("uses browser geolocation and rounds coordinates", async () => {
    const onChange = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 40.41681234, longitude: -3.70381234 } } as GeolocationPosition),
      },
    });

    render(<IncidentLocationPicker onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Usar mi ubicación" }));

    expect(onChange).toHaveBeenCalledWith({ latitude: 40.416812, longitude: -3.703812 });
  });

  it("explains when the browser has no geolocation support", () => {
    vi.stubGlobal("navigator", { ...navigator, geolocation: undefined });

    render(<IncidentLocationPicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Usar mi ubicación" }));

    expect(screen.getByRole("alert")).toHaveTextContent("no ofrece geolocalización");
  });

  it("explains when location permission is denied", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1 } as GeolocationPositionError),
      },
    });

    render(<IncidentLocationPicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Usar mi ubicación" }));

    expect(screen.getByRole("alert")).toHaveTextContent("No se ha concedido permiso");
  });
});
