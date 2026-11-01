import { z } from "zod";

export const createIncidentSchema = z.object({
  title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres").max(120),
  description: z.string().trim().min(10, "La descripción debe tener al menos 10 caracteres").max(2000),
  categoryId: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Selecciona una categoría",
  ),
  address: z.string().trim().max(200).optional(),
  district: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).refine((data) => (data.latitude === undefined) === (data.longitude === undefined), {
  message: "Indica latitud y longitud juntas",
  path: ["longitude"],
});
