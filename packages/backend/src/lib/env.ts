// Validación de configuración al arrancar.
//
// Sin esto, una variable ausente no se nota hasta que un usuario real intenta
// registrarse: `jwt.sign` revienta con un secreto `undefined` y el frontend
// recibe un 500 genérico. Es mucho mejor que el proceso no arranque y que el
// log del despliegue diga exactamente qué falta.

const REQUIRED = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const;

/** Longitud mínima razonable para un secreto de firma. */
const MIN_SECRET_LENGTH = 16;

export function assertRequiredEnv(): void {
  const missing = REQUIRED.filter((name) => !(process.env[name] || "").trim());

  if (missing.length > 0) {
    console.error(
      `[CONFIG] Faltan variables de entorno obligatorias: ${missing.join(", ")}. ` +
        `El servicio no puede arrancar sin ellas.`
    );
    process.exit(1);
  }

  const weak = (["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const).filter(
    (name) => (process.env[name] || "").trim().length < MIN_SECRET_LENGTH
  );
  if (weak.length > 0) {
    console.warn(`[CONFIG] Secretos demasiado cortos (<${MIN_SECRET_LENGTH} caracteres): ${weak.join(", ")}.`);
  }

  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.warn("[CONFIG] JWT_ACCESS_SECRET y JWT_REFRESH_SECRET son iguales: usa secretos distintos.");
  }

  if (!(process.env.FRONTEND_URL || "").trim()) {
    console.warn(
      "[CONFIG] FRONTEND_URL no está definida. CORS aceptará *.vercel.app y localhost, " +
        "pero conviene fijarla al dominio real (también se usa en los enlaces de verificación por email)."
    );
  }
}
