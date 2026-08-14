import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Router } from "express";
import { isEmailDeliveryConfigured, sendVerificationEmail } from "../lib/email";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.validators";

const router = Router();

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Primer origen configurado en FRONTEND_URL, sin barra final.
function getFrontendUrl(): string {
  const raw = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim();
  return raw.replace(/\/+$/, "");
}

router.post("/register", authLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Solo exigimos verificación por email si realmente podemos enviar el correo.
    // Sin proveedor configurado el usuario nunca recibiría el enlace y la cuenta
    // quedaría inutilizable, así que la activamos al momento.
    const requiresVerification = isEmailDeliveryConfigured();
    const verificationToken = requiresVerification ? crypto.randomBytes(32).toString("hex") : null;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        emailVerified: !requiresVerification,
        verificationToken,
        verificationExpiresAt: requiresVerification ? new Date(Date.now() + VERIFICATION_TTL_MS) : null,
      },
    });

    if (requiresVerification && verificationToken) {
      const verificationUrl = `${getFrontendUrl()}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(user.email, verificationUrl);

      return res.status(201).json({
        requiresVerification: true,
        message: "Cuenta creada. Revisa tu email para verificar tu cuenta.",
      });
    }

    // Cuenta lista para usarse: devolvemos sesión para que el registro termine
    // directamente en el panel correspondiente.
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.status(201).json({
      requiresVerification: false,
      message: "Cuenta creada correctamente.",
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) return res.status(400).json({ error: "Token de verificación requerido." });

    const user = await prisma.user.findUnique({ where: { verificationToken: token } });
    if (!user || !user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
      return res.status(400).json({ error: "Token inválido o expirado." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpiresAt: null },
    });

    res.json({ message: "Email verificado correctamente. Ya puedes iniciar sesión." });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas." });

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Debes verificar tu email antes de iniciar sesión." });
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", validateBody(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: "Refresh token inválido o expirado." });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Refresh token inválido." });
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.user!.userId }, data: { refreshToken: null } });
    res.json({ message: "Sesión cerrada." });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { brand: true, creator: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const { password, verificationToken, verificationExpiresAt, refreshToken, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

export default router;
