import { describe, expect, it } from "vitest";

import { createIncidentSchema } from "@/features/incidents/lib/schemas";

const base = {
  title: "Farola apagada",
  description: "La farola no enciende desde ayer por la noche.",
  categoryId: "11111111-1111-1111-1111-111111111111",
};

describe("createIncidentSchema", () => {
  it("acepta una ubicación completa dentro de rango", () => {
    const result = createIncidentSchema.safeParse({ ...base, latitude: 40.41691, longitude: -3.70352 });
    expect(result.success).toBe(true);
  });

  it("exige latitud y longitud juntas", () => {
    const result = createIncidentSchema.safeParse({ ...base, latitude: 40.41691 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Indica latitud y longitud juntas");
  });

  it("rechaza coordenadas fuera de rango", () => {
    expect(createIncidentSchema.safeParse({ ...base, latitude: 91, longitude: -3.70352 }).success).toBe(false);
    expect(createIncidentSchema.safeParse({ ...base, latitude: 40.41691, longitude: -181 }).success).toBe(false);
  });
});
