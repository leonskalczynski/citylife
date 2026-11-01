import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Introduce un email válido"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72),
});

