import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Router } from "express";
import { sendVerificationEmail } from "../lib/email";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.validators";

const router = Router();

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

router.post("/register", authLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        verificationToken,
        verificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(user.email, verificationUrl);

    res.status(201).json({
      message: "Cuenta creada. Revisa tu email para verificar tu cuenta.",
      ...(process.env.NODE_ENV !== "production" ? { devVerificationUrl: verificationUrl } : {}),
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

    const { password, verificationToken, refreshToken, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

export default router;
