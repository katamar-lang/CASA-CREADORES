import { ApiError, NetworkError } from "./api";

// Traduce cualquier error a un mensaje presentable para el usuario.
// El detalle técnico se registra en consola para depuración, nunca en pantalla.
export function toUserMessage(error: unknown, fallback = "Algo salió mal. Inténtalo de nuevo."): string {
  if (error instanceof NetworkError) {
    console.error("[API] Fallo de red:", error.cause ?? error);
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  }

  if (error instanceof ApiError) {
    // 5xx: el mensaje del servidor puede ser técnico, así que no lo mostramos.
    if (error.status >= 500) {
      console.error("[API] Error del servidor:", error.status, error.message, error.details);
      return "El servicio no está disponible en este momento. Inténtalo de nuevo en unos minutos.";
    }

    // 4xx: el backend devuelve mensajes pensados para el usuario final.
    if (error.details) console.warn("[API] Detalle de validación:", error.details);
    return error.message || fallback;
  }

  console.error("[APP] Error inesperado:", error);
  return fallback;
}
