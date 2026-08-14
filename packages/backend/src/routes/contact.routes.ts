import { Router } from "express";
import { prisma } from "../lib/prisma";
import { contactLimiter } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { contactMessageSchema } from "../validators/contact.validators";

const router = Router();

// Formulario de contacto público. Los mensajes se guardan en base de datos y
// se revisan desde el panel de administración; no dependemos de un buzón de
// email externo para no perder consultas.
router.post("/", contactLimiter, validateBody(contactMessageSchema), async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    await prisma.contactMessage.create({ data: { name, email, message } });
    console.log(`[CONTACTO] Nuevo mensaje de ${email}`);

    res.status(201).json({ message: "Gracias por escribirnos. Te responderemos pronto." });
  } catch (err) {
    next(err);
  }
});

export default router;
