import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { brandProfileSchema } from "../validators/brands.validators";

const router = Router();

router.get("/me", requireAuth, requireRole("MARCA"), async (req: AuthRequest, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { userId: req.user!.userId } });
    if (!brand) return res.status(404).json({ error: "Perfil de marca no encontrado. Complétalo primero." });
    res.json(brand);
  } catch (err) {
    next(err);
  }
});

router.put("/me", requireAuth, requireRole("MARCA"), validateBody(brandProfileSchema), async (req: AuthRequest, res, next) => {
  try {
    const { companyName, website, industry } = req.body;
    const brand = await prisma.brand.upsert({
      where: { userId: req.user!.userId },
      update: { companyName, website, industry },
      create: { userId: req.user!.userId, companyName, website, industry },
    });
    res.json(brand);
  } catch (err) {
    next(err);
  }
});

export default router;
