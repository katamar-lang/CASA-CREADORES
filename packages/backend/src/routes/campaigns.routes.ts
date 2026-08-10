import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  applicationStatusSchema,
  campaignSchema,
  campaignStatusSchema,
} from "../validators/campaigns.validators";

const router = Router();

async function getOwnBrandOrThrow(userId: string) {
  const brand = await prisma.brand.findUnique({ where: { userId } });
  if (!brand) throw new ApiError(404, "Completa tu perfil de marca antes de crear campañas.");
  return brand;
}

async function getOwnCreatorOrThrow(userId: string) {
  const creator = await prisma.creator.findUnique({ where: { userId } });
  if (!creator) throw new ApiError(404, "Completa tu perfil de creador antes de aplicar a campañas.");
  return creator;
}

// Listado público de campañas activas (creadores navegan/buscan aquí)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && typeof status === "string") {
      where.status = status;
    } else {
      where.status = "ACTIVE";
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { brand: { select: { companyName: true, industry: true, website: true } } },
    });
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
});

router.get("/mine", requireAuth, requireRole("MARCA"), async (req: AuthRequest, res, next) => {
  try {
    const brand = await getOwnBrandOrThrow(req.user!.userId);
    const campaigns = await prisma.campaign.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
});

router.get("/mine/applications", requireAuth, requireRole("CREADOR"), async (req: AuthRequest, res, next) => {
  try {
    const creator = await getOwnCreatorOrThrow(req.user!.userId);
    const applications = await prisma.campaignApplication.findMany({
      where: { creatorId: creator.id },
      orderBy: { appliedAt: "desc" },
      include: { campaign: true },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("MARCA"), validateBody(campaignSchema), async (req: AuthRequest, res, next) => {
  try {
    const brand = await getOwnBrandOrThrow(req.user!.userId);
    const { title, description, budgetUSDC, duration, minFollowers, minEngagementRate } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        title,
        description,
        budgetUSDC,
        duration,
        minFollowers,
        minEngagementRate,
        status: "ACTIVE",
      },
    });
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { brand: { select: { companyName: true, industry: true, website: true } } },
    });
    if (!campaign) return res.status(404).json({ error: "Campaña no encontrada." });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("MARCA"),
  validateBody(campaignStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const brand = await getOwnBrandOrThrow(req.user!.userId);
      const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
      if (!campaign || campaign.brandId !== brand.id) {
        return res.status(404).json({ error: "Campaña no encontrada." });
      }
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: req.body.status },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id/applications", requireAuth, requireRole("MARCA"), async (req: AuthRequest, res, next) => {
  try {
    const brand = await getOwnBrandOrThrow(req.user!.userId);
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign || campaign.brandId !== brand.id) {
      return res.status(404).json({ error: "Campaña no encontrada." });
    }
    const applications = await prisma.campaignApplication.findMany({
      where: { campaignId: campaign.id },
      orderBy: { appliedAt: "desc" },
      include: { creator: { include: { user: { select: { email: true } } } } },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/apply", requireAuth, requireRole("CREADOR"), async (req: AuthRequest, res, next) => {
  try {
    const creator = await getOwnCreatorOrThrow(req.user!.userId);
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ error: "Campaña no encontrada." });
    if (campaign.status !== "ACTIVE") {
      return res.status(400).json({ error: "Esta campaña no está aceptando aplicaciones." });
    }

    const existing = await prisma.campaignApplication.findUnique({
      where: { campaignId_creatorId: { campaignId: campaign.id, creatorId: creator.id } },
    });
    if (existing) return res.status(409).json({ error: "Ya aplicaste a esta campaña." });

    const application = await prisma.campaignApplication.create({
      data: { campaignId: campaign.id, creatorId: creator.id },
    });
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id/applications/:appId",
  requireAuth,
  requireRole("MARCA"),
  validateBody(applicationStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const brand = await getOwnBrandOrThrow(req.user!.userId);
      const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
      if (!campaign || campaign.brandId !== brand.id) {
        return res.status(404).json({ error: "Campaña no encontrada." });
      }

      const application = await prisma.campaignApplication.findUnique({ where: { id: req.params.appId } });
      if (!application || application.campaignId !== campaign.id) {
        return res.status(404).json({ error: "Aplicación no encontrada." });
      }

      const updated = await prisma.campaignApplication.update({
        where: { id: application.id },
        data: { status: req.body.status },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
