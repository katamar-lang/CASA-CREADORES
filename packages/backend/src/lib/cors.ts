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

// Los despliegues de preview de Vercel usan subdominios distintos en cada build
// (proyecto-hash-scope.vercel.app). Si el origen permitido es un *.vercel.app,
// aceptamos también los previews del mismo proyecto.
function isAllowedVercelPreview(origin: string, allowed: string[]): boolean {
  if (!origin.endsWith(".vercel.app")) return false;

  return allowed.some((entry) => {
    if (!entry.endsWith(".vercel.app")) return false;
    const project = entry.replace(/^https?:\/\//, "").split(".")[0].split("-")[0];
    return project.length > 0 && origin.includes(project);
  });
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin(origin, callback) {
      // Peticiones sin Origin (health checks, curl, server-to-server) siempre pasan.
      if (!origin) return callback(null, true);

      const allowed = getAllowedOrigins();
      const normalized = normalizeOrigin(origin);

      if (allowed.includes(normalized) || isAllowedVercelPreview(normalized, allowed)) {
        return callback(null, true);
      }

      // No lanzamos error: devolvemos "no permitido" y dejamos rastro en logs,
      // que es lo que realmente sirve para diagnosticar un CORS mal configurado.
      console.warn(`[CORS] Origen bloqueado: ${normalized}. Permitidos: ${allowed.join(", ") || "(ninguno)"}`);
      return callback(null, false);
    },
    credentials: true,
  };
}
