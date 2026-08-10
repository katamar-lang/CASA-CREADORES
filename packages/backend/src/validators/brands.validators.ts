import { z } from "zod";

export const brandProfileSchema = z.object({
  companyName: z.string().min(2, "Nombre de empresa requerido."),
  website: z.string().url("Debe ser una URL válida."),
  industry: z.enum(["Cripto", "Fintech", "Exchange", "Wallet", "DeFi Protocol"], {
    errorMap: () => ({ message: "Industria inválida." }),
  }),
});
