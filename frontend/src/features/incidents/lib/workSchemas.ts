import { z } from "zod";

export const workNotesSchema = z.object({
  notes: z.string().max(2000, "Las notas no pueden superar los 2000 caracteres"),
});

export const resolveWorkSchema = z.object({
  summary: z.string().trim().min(10, "Describe la resolución con al menos 10 caracteres").max(2000, "La resolución no puede superar los 2000 caracteres"),
});
