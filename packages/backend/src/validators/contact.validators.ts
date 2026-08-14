import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().min(2, "El nombre es requerido.").max(120),
  email: z.string().email("Email inválido."),
  message: z.string().min(10, "Cuéntanos un poco más (mínimo 10 caracteres).").max(2000),
});
