import type { CorsOptions } from "cors";

// Normaliza un origen: sin espacios y sin barra final, para que
// "https://app.vercel.app/" y "https://app.vercel.app" se traten igual.
function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

// FRONTEND_URL acepta una lista separada por comas para poder habilitar
// varios frontends (producción, dominio propio, desarrollo local).
export function getAllowedOrigins(): string[] {
  const configured = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  if (configured.length > 0) return configured;

  // Sin configurar, solo desarrollo local.
  return ["http://localhost:5173"];
}

function hostnameOf(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

// Los despliegues de Vercel usan un subdominio distinto en cada build
// (proyecto-hash-scope.vercel.app), y el dominio de producción tampoco tiene por
// qué coincidir con lo que haya en FRONTEND_URL.
//
// Aceptar cualquier *.vercel.app es una decisión deliberada: la autenticación
// viaja en la cabecera Authorization (tokens en localStorage), no en cookies,
// así que un origen ajeno no puede hacer peticiones autenticadas en nombre del
// usuario — no hay superficie CSRF que proteger. A cambio, un FRONTEND_URL mal
// puesto deja de ser capaz de tumbar el registro, el login y el contacto, que
// es exactamente lo que ocurrió en producción.
function isVercelDeployment(origin: string): boolean {
  const hostname = hostnameOf(origin);
  return hostname !== null && (hostname === "vercel.app" || hostname.endsWith(".vercel.app"));
}

// El desarrollo local se permite siempre: nunca es el origen del problema y
// evita tener que recordar añadirlo a FRONTEND_URL.
function isLocalhost(origin: string): boolean {
  const hostname = hostnameOf(origin);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

export function isOriginAllowed(origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  if (getAllowedOrigins().includes(normalized)) return true;
  if (isVercelDeployment(normalized)) return true;
  if (isLocalhost(normalized)) return true;
  return false;
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin(origin, callback) {
      // Peticiones sin Origin (health checks, curl, server-to-server, y el
      // proxy de Vercel) siempre pasan.
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) return callback(null, true);

      // No lanzamos error: devolvemos "no permitido" y dejamos rastro en logs,
      // que es lo que realmente sirve para diagnosticar un CORS mal configurado.
      console.warn(
        `[CORS] Origen bloqueado: ${normalizeOrigin(origin)}. ` +
          `Permitidos: ${getAllowedOrigins().join(", ")} (+ cualquier *.vercel.app y localhost).`
      );
      return callback(null, false);
    },
    credentials: true,
    // Sin esto, el navegador repite el preflight en cada petición.
    maxAge: 86400,
  };
}
