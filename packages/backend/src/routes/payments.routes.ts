import crypto from "crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createPaymentSchema } from "../validators/payments.validators";

const router = Router();

// Simula una transacción en la blockchain de USDC (mock). En producción esto
// se reemplaza por una integración real con Circle API / Stripe Crypto.
function simulateUsdcTransaction(): string {
  return `0x${crypto.randomBytes(32).toString("hex")}`;
}

router.get("/mine", requireAuth, requireRole("MARCA"), async (req: AuthRequest, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { userId: req.user!.userId } });
    if (!brand) return res.json([]);

    const payments = await prisma.payment.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { title: true } } },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("MARCA"), validateBody(createPaymentSchema), async (req: AuthRequest, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { userId: req.user!.userId } });
    if (!brand) return res.status(404).json({ error: "Completa tu perfil de marca primero." });

    const { campaignId, amountUSDC } = req.body;
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.brandId !== brand.id) {
      return res.status(404).json({ error: "Campaña no encontrada." });
    }

    // MVP: simula el pago inmediatamente. Punto de extensión para Circle API real.
    const txHash = simulateUsdcTransaction();
    const payment = await prisma.payment.create({
      data: {
        brandId: brand.id,
        campaignId: campaign.id,
        amountUSDC,
        txHash,
        status: "COMPLETED",
      },
    });

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

export default router;
