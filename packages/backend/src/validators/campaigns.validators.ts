import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres.").max(120),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(2000),
  budgetUSDC: z.number().positive("El presupuesto debe ser mayor a 0."),
  duration: z.number().int().positive("La duración debe ser en días, mayor a 0."),
  minFollowers: z.number().int().min(0).optional().default(0),
  minEngagementRate: z.number().min(0).optional().default(0),
});

export const campaignStatusSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]),
});

export const applicationStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});
