import { API_URL, ApiConfigError, ApiError, NetworkError } from "./api";

// Traduce cualquier error a un mensaje presentable para el usuario.
// El detalle técnico se registra en consola para depuración, nunca en pantalla.
export function toUserMessage(error: unknown, fallback = "Algo salió mal. Inténtalo de nuevo."): string {
  if (error instanceof NetworkError) {
    console.error(`[API] Fallo de red llamando a ${API_URL}:`, error.cause ?? error);
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  }

  // La petición sí viajó, pero no la contestó el backend. Decirlo tal cual
  // evita mandar al usuario a revisar su wifi cuando el problema es nuestro.
  if (error instanceof ApiConfigError) {
    console.error("[API] Respuesta inesperada:", error.detail);
    return "El servicio no está disponible en este momento. Estamos al tanto; inténtalo de nuevo en unos minutos.";
  }

  if (error instanceof ApiError) {
    // 429: el límite de intentos merece un mensaje propio, no un "algo salió mal".
    if (error.status === 429) {
      return error.message || "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    }

    // 5xx: el mensaje del servidor puede ser técnico, así que no lo mostramos.
    if (error.status >= 500) {
      console.error("[API] Error del servidor:", error.status, error.message, error.details);
      return "El servicio no está disponible en este momento. Inténtalo de nuevo en unos minutos.";
    }

    // 4xx: el backend devuelve mensajes pensados para el usuario final.
    // Si además hay detalles de validación, los mostramos: saber qué campo
    // falla es más útil que un "Datos inválidos." a secas.
    if (error.details) {
      console.warn("[API] Detalle de validación:", error.details);
      const detail = formatValidationDetails(error.details);
      if (detail) return detail;
    }
    return error.message || fallback;
  }

  console.error("[APP] Error inesperado:", error);
  return fallback;
}

// El backend devuelve `details: [{ path, message }]` para los errores de Zod.
function formatValidationDetails(details: unknown): string | null {
  if (!Array.isArray(details)) return null;

  const messages = details
    .map((item) => (item && typeof item === "object" ? (item as { message?: unknown }).message : null))
    .filter((message): message is string => typeof message === "string" && message.length > 0);

  return messages.length > 0 ? messages.join(" ") : null;
}
