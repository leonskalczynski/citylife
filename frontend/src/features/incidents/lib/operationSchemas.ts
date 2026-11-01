import { z } from "zod";

export const rejectIncidentSchema = z.object({
  reason: z.string().trim().min(5, "Explica el motivo con al menos 5 caracteres").max(500),
});

export const prioritySchema = z.object({
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
});

export const assignmentSchema = z.object({
  departmentId: z.string().min(1, "Selecciona un departamento"),
  technicianId: z.string().optional(),
});
