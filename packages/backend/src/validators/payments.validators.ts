import { z } from "zod";

export const createPaymentSchema = z.object({
  campaignId: z.string().uuid("campaignId inválido."),
  amountUSDC: z.number().positive("El monto debe ser mayor a 0."),
});
