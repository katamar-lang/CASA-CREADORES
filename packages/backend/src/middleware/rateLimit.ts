import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
});

// Freno de fuerza bruta para credenciales.
//
// `skipSuccessfulRequests` es lo importante: sin ello, el contador también
// gastaba cupo con los inicios de sesión y registros correctos, así que varias
// personas detrás de la misma IP pública (una oficina, una red móvil con NAT)
// se quedaban fuera con un 429 sin haber fallado ni una vez. Lo que interesa
// limitar son los intentos fallidos.
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo." },
});

// El formulario de contacto tenía su propio problema: compartía el cupo del
// login, de modo que alguien que se equivocaba de contraseña un par de veces
// podía quedarse sin poder escribirnos. Cupo propio y contando todos los
// envíos, que aquí lo que se frena es el spam.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Has enviado varios mensajes seguidos. Espera un momento antes de escribirnos de nuevo." },
});
