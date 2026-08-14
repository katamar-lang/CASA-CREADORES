const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
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
      return await fetch(`${API_URL}${path}`, {
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
  let body: any = null;
  if (contentType.includes("application/json")) {
    try {
      body = await res.json();
    } catch (cause) {
      console.error("[API] Respuesta JSON inválida:", cause);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, body?.error || "Ocurrió un error inesperado.", body?.details);
  }

  return body as T;
}
