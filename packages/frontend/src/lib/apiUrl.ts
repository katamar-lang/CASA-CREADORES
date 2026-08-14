// Resolución de la URL del backend.
//
// Historia del bug que este módulo previene: en producción el bundle se
// construyó sin `VITE_API_URL`, así que quedó embebido el valor de desarrollo
// `http://localhost:4000/api`. En una página servida por HTTPS eso falla dos
// veces (mixed content + no hay nada escuchando en el equipo del visitante),
// `fetch` rechaza y toda la app muestra "No pudimos conectar con el servidor".
//
// Por eso aquí NUNCA se devuelve una URL de localhost si la página no se está
// sirviendo desde localhost: se prefiere el mismo origen (`/api`), que funciona
// gracias al proxy de Vercel en `packages/frontend/api/[...path].ts`.

/**
 * Backend público de producción (Railway).
 *
 * Está en el repositorio a propósito: es una URL pública, y tenerla aquí
 * significa que el despliegue funciona sin depender de que alguien recuerde
 * definir una variable en el panel de Vercel. Solo se usa como red de
 * seguridad; la ruta normal es el mismo origen (`/api`) a través del proxy.
 */
export const DIRECT_BACKEND_API_URL = "https://casa-creadores-production.up.railway.app/api";

/**
 * Permite cambiar el backend sin reconstruir el bundle: basta con inyectar
 * `window.__CASA_CREADORES_API_URL__ = "https://..."` antes de cargar la app.
 */
const RUNTIME_OVERRIDE_KEY = "__CASA_CREADORES_API_URL__";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"]);

export type ApiUrlSource =
  | "runtime-override"
  | "vite-env"
  | "same-origin"
  | "local-dev";

export interface ResolvedApiUrl {
  /** Base ya normalizada, sin barra final. Puede ser relativa (`/api`). */
  url: string;
  source: ApiUrlSource;
  /** Problemas detectados durante la resolución, para diagnóstico. */
  warnings: string[];
}

function isLocalPage(): boolean {
  if (typeof window === "undefined") return true;
  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function pointsToLocalhost(value: string): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

/**
 * Normaliza una base absoluta. Corrige dos errores de configuración habituales:
 * la barra final (`https://api.example.com/api/`) y olvidar el sufijo `/api`
 * (`https://api.example.com`), que haría que todas las rutas devolvieran 404.
 */
function normalizeAbsoluteBase(raw: string): string {
  const trimmed = stripTrailingSlashes(raw.trim());
  try {
    const parsed = new URL(trimmed);
    if (stripTrailingSlashes(parsed.pathname) === "") return `${trimmed}/api`;
    return trimmed;
  } catch {
    return trimmed;
  }
}

function readCandidate(raw: unknown): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  // Solo aceptamos bases absolutas http(s) o rutas relativas que empiecen por "/".
  if (/^https?:\/\//i.test(value)) return normalizeAbsoluteBase(value);
  if (value.startsWith("/")) return stripTrailingSlashes(value) || "/api";
  return null;
}

export function resolveApiUrl(): ResolvedApiUrl {
  const warnings: string[] = [];
  const local = isLocalPage();

  const candidates: Array<{ source: ApiUrlSource; raw: unknown }> = [
    {
      source: "runtime-override",
      raw: typeof window === "undefined" ? undefined : (window as any)[RUNTIME_OVERRIDE_KEY],
    },
    { source: "vite-env", raw: import.meta.env.VITE_API_URL },
  ];

  for (const { source, raw } of candidates) {
    const value = readCandidate(raw);
    if (!value) continue;

    // La trampa original: una URL de localhost en una página pública es
    // inservible. La descartamos en vez de dejar que la app falle en cada
    // petición con un error de red genérico.
    if (!local && pointsToLocalhost(value)) {
      warnings.push(
        `Se ignoró ${source} porque apunta a ${value}, inalcanzable desde un navegador que no sea el del propio servidor.`
      );
      continue;
    }

    return { url: value, source, warnings };
  }

  if (local) return { url: "http://localhost:4000/api", source: "local-dev", warnings };

  // Mismo origen: lo sirve el proxy de Vercel, así que no hay CORS que romper.
  return { url: "/api", source: "same-origin", warnings };
}

export const API_URL_INFO = resolveApiUrl();
export const API_URL = API_URL_INFO.url;

if (API_URL_INFO.warnings.length > 0) {
  for (const warning of API_URL_INFO.warnings) console.warn(`[API] ${warning}`);
  console.warn(`[API] Usando ${API_URL} (origen: ${API_URL_INFO.source}).`);
}
