import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { z } from "zod";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

const verifyCreatorSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
});

router.get("/creators", async (req, res, next) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && typeof status === "string") where.verifiedStatus = status;

    const creators = await prisma.creator.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, createdAt: true } } },
    });
    res.json(creators);
  } catch (err) {
    next(err);
  }
});

router.patch("/creators/:id/verify", validateBody(verifyCreatorSchema), async (req, res, next) => {
  try {
    const creator = await prisma.creator.update({
      where: { id: req.params.id },
      data: { verifiedStatus: req.body.status },
    });
    res.json(creator);
  } catch (err) {
    next(err);
  }
});

router.get("/contact-messages", async (_req, res, next) => {
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.patch("/contact-messages/:id", validateBody(z.object({ handled: z.boolean() })), async (req, res, next) => {
  try {
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { handled: req.body.handled },
    });
    res.json(message);
  } catch (err) {
    next(err);
  }
});

router.get("/payments", async (_req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { companyName: true } },
        campaign: { select: { title: true } },
      },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (_req, res, next) => {
  try {
    const [totalBrands, totalCreators, pendingCreators, totalCampaigns, activeCampaigns, payments] =
      await Promise.all([
        prisma.brand.count(),
        prisma.creator.count(),
        prisma.creator.count({ where: { verifiedStatus: "PENDING" } }),
        prisma.campaign.count(),
        prisma.campaign.count({ where: { status: "ACTIVE" } }),
        prisma.payment.findMany({ where: { status: "COMPLETED" } }),
      ]);

    const totalRevenueUSDC = payments.reduce((sum, p) => sum + p.amountUSDC, 0);
    // Comisión de plataforma: 15-20%. Usamos 17.5% como estimado promedio para el panel.
    const platformCommissionUSDC = totalRevenueUSDC * 0.175;

    res.json({
      totalBrands,
      totalCreators,
      pendingCreators,
      totalCampaigns,
      activeCampaigns,
      totalPayments: payments.length,
      totalRevenueUSDC,
      platformCommissionUSDC,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
