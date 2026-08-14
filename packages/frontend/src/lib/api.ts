import { API_URL, API_URL_INFO, DIRECT_BACKEND_API_URL } from "./apiUrl";

export { API_URL, API_URL_INFO };

// Base efectiva. Empieza en la resuelta al cargar (normalmente el mismo origen)
// y solo cambia si se detecta que el proxy `/api` no está desplegado.
let activeBase = API_URL;

export function getActiveApiUrl(): string {
  return activeBase;
}

/**
 * Red de seguridad para un único escenario: la web se sirve desde Vercel pero
 * la función `api/[...path].ts` no está activa, así que `/api/...` devuelve el
 * index.html de la SPA en vez de JSON. En ese caso se pasa a hablar
 * directamente con el backend de Railway, que acepta por CORS cualquier origen
 * *.vercel.app. Sin esto, la app quedaría rota esperando a que alguien
 * revisara la configuración del panel de Vercel.
 */
function switchToDirectBackend(reason: string): boolean {
  if (activeBase === DIRECT_BACKEND_API_URL) return false;
  if (API_URL_INFO.source !== "same-origin") return false;

  console.warn(`[API] ${reason} Cambiando a ${DIRECT_BACKEND_API_URL}.`);
  activeBase = DIRECT_BACKEND_API_URL;
  return true;
}

const ACCESS_TOKEN_KEY = "cc_access_token";
const REFRESH_TOKEN_KEY = "cc_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// El servidor no respondió: sin conexión, backend caído o CORS bloqueado.
// Se distingue de ApiError para poder mostrar un mensaje distinto.
export class NetworkError extends Error {
  cause?: unknown;
  constructor(cause?: unknown) {
    super("No se pudo conectar con el servidor.");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

// La petición llegó a algún sitio, pero la respuesta no es la del backend
// (típicamente el index.html de la SPA porque el proxy `/api` no está
// desplegado). Sin esto, `apiFetch` devolvería `null` y la pantalla fallaría
// más adelante con un error sin relación con la causa.
export class ApiConfigError extends Error {
  detail: string;
  constructor(detail: string) {
    super("La API no está respondiendo correctamente.");
    this.name = "ApiConfigError";
    this.detail = detail;
  }
}

function buildUrl(path: string): string {
  return `${activeBase}${path}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    return data.accessToken as string;
  } catch (cause) {
    // Sin red no invalidamos la sesión: puede ser un corte temporal.
    console.error("[API] No se pudo refrescar la sesión:", cause);
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const doFetch = async (token: string | null) => {
    try {
      return await fetch(buildUrl(path), {
        ...rest,
        headers: {
          "Content-Type": "application/json",
          ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      });
    } catch (cause) {
      // fetch solo rechaza por fallo de red/CORS, no por códigos de error HTTP.
      throw new NetworkError(cause);
    }
  };

  let res = await doFetch(getAccessToken());

  if (res.status === 401 && !skipAuth && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  // Una respuesta sin JSON desde el mismo origen significa casi siempre que el
  // proxy `/api` no está desplegado y hemos recibido el index.html de la SPA.
  // Se reintenta una sola vez contra el backend directo antes de darlo por
  // perdido; `switchToDirectBackend` solo devuelve true la primera vez.
  if (!isJson && res.status !== 204) {
    if (switchToDirectBackend(`${buildUrl(path)} no devolvió JSON (content-type "${contentType || "desconocido"}").`)) {
      return apiFetch<T>(path, options);
    }
  }

  let body: any = null;
  if (isJson) {
    try {
      body = await res.json();
    } catch (cause) {
      console.error("[API] Respuesta JSON inválida:", cause);
      throw new ApiConfigError(`${buildUrl(path)} devolvió JSON malformado (HTTP ${res.status}).`);
    }
  }

  if (!res.ok) {
    if (!isJson) {
      throw new ApiConfigError(
        `${buildUrl(path)} devolvió HTTP ${res.status} con content-type "${contentType || "desconocido"}" ` +
          `en vez de JSON. Revisa que la API esté desplegada y accesible.`
      );
    }
    throw new ApiError(res.status, body?.error || "Ocurrió un error inesperado.", body?.details);
  }

  // 204 y similares no traen cuerpo; cualquier otra respuesta OK sin JSON
  // significa que no estamos hablando con el backend.
  if (!isJson && res.status !== 204) {
    throw new ApiConfigError(
      `${buildUrl(path)} respondió HTTP ${res.status} con content-type "${contentType || "desconocido"}" ` +
        `en vez de JSON. Probablemente la petición no llegó al backend.`
    );
  }

  return body as T;
}
