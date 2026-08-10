import { z } from "zod";

export const creatorProfileSchema = z.object({
  bio: z.string().max(500, "La bio no puede superar 500 caracteres.").optional().default(""),
  xHandle: z.string().max(50).optional().nullable(),
  igHandle: z.string().max(50).optional().nullable(),
  tiktokHandle: z.string().max(50).optional().nullable(),
  followerCount: z.number().int().min(0).optional().default(0),
  nichos: z.array(z.string()).max(5, "Máximo 5 nichos.").optional().default([]),
});
