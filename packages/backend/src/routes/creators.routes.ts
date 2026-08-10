import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { creatorProfileSchema } from "../validators/creators.validators";

const router = Router();

// Listado/matching de creadores. Cualquier usuario autenticado puede explorar
// (las marcas lo usan para encontrar creadores sugeridos).
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { nicho, minFollowers, verified } = req.query;

    const where: any = {};
    if (nicho && typeof nicho === "string") {
      where.nichos = { has: nicho };
    }
    if (minFollowers && !Number.isNaN(Number(minFollowers))) {
      where.followerCount = { gte: Number(minFollowers) };
    }
    if (verified === "true") {
      where.verifiedStatus = "VERIFIED";
    }

    const creators = await prisma.creator.findMany({
      where,
      orderBy: { followerCount: "desc" },
      include: { user: { select: { email: true, createdAt: true } } },
    });

    res.json(creators);
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, requireRole("CREADOR"), async (req: AuthRequest, res, next) => {
  try {
    const creator = await prisma.creator.findUnique({ where: { userId: req.user!.userId } });
    if (!creator) return res.status(404).json({ error: "Perfil de creador no encontrado. Complétalo primero." });
    res.json(creator);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/me",
  requireAuth,
  requireRole("CREADOR"),
  validateBody(creatorProfileSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { bio, xHandle, igHandle, tiktokHandle, followerCount, nichos } = req.body;
      const creator = await prisma.creator.upsert({
        where: { userId: req.user!.userId },
        update: { bio, xHandle, igHandle, tiktokHandle, followerCount, nichos },
        create: { userId: req.user!.userId, bio, xHandle, igHandle, tiktokHandle, followerCount, nichos },
      });
      res.json(creator);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { email: true, createdAt: true } } },
    });
    if (!creator) return res.status(404).json({ error: "Creador no encontrado." });
    res.json(creator);
  } catch (err) {
    next(err);
  }
});

export default router;
