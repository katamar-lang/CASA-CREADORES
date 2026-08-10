import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(["MARCA", "CREADOR"], { errorMap: () => ({ message: "Rol debe ser MARCA o CREADOR." }) }),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken es requerido."),
});
