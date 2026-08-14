// Proxy de `/api/*` hacia el backend (Railway), ejecutado como función
// serverless de Vercel.
//
// Por qué existe:
//
// 1. **Sin CORS.** El navegador habla siempre con el mismo origen que sirve la
//    web, así que ningún desajuste entre `FRONTEND_URL` y el dominio de Vercel
//    puede volver a romper el registro, el login o el formulario de contacto.
// 2. **Sin recompilar.** `BACKEND_URL` se lee en cada petición, no queda
//    congelada en el bundle como pasaba con `VITE_API_URL`. Cambiar el backend
//    es cambiar la variable, sin nuevo build.
// 3. **Errores explícitos.** Si falta la configuración o el backend está caído,
//    el usuario recibe un JSON con la causa concreta en vez de un fallo de red
//    genérico.
//
// Está escrito contra la API cruda de `node:http` (`writeHead`/`end`) en vez de
// contra los ayudantes que Vercel añade a `res` (`status`, `json`, `send`): así
// el mismo fichero se puede ejecutar y probar fuera de Vercel.

import type { IncomingMessage, ServerResponse } from "node:http";

/** Cabeceras que pertenecen a la conexión y no deben reenviarse. */
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "content-encoding",
  "host",
]);

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload).toString(),
  });
  res.end(payload);
}

/**
 * Backend de producción. Está en el repositorio para que el despliegue no
 * dependa de que la variable esté puesta en el panel de Vercel: `BACKEND_URL`
 * sigue teniendo prioridad si algún día cambia la URL.
 */
const DEFAULT_BACKEND_URL = "https://casa-creadores-production.up.railway.app";

function resolveBackendBase(): string | null {
  const raw = (process.env.BACKEND_URL || process.env.API_URL || DEFAULT_BACKEND_URL).trim();
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const withoutTrailingSlash = withProtocol.replace(/\/+$/, "");
  // Se acepta tanto "https://backend.up.railway.app" como ".../api": las rutas
  // que llegan ya vienen prefijadas con `/api`, así que se quita el sufijo
  // duplicado en vez de generar `/api/api/...`.
  return withoutTrailingSlash.replace(/\/api$/i, "");
}

/**
 * Se reenvía el cuerpo en bruto, sin parsearlo: así el proxy funciona igual
 * para JSON que para cualquier otro formato que la API acepte en el futuro.
 */
function readRawBody(req: IncomingMessage): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    req.on("end", () => {
      const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(merged);
    });
    req.on("error", reject);
  });
}

function forwardableHeaders(req: IncomingMessage): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (HOP_BY_HOP.has(name.toLowerCase())) continue;
    headers[name] = Array.isArray(value) ? value.join(", ") : value;
  }
  return headers;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const backend = resolveBackendBase();

  if (!backend) {
    return sendJson(res, 503, {
      error:
        "La API no está configurada: falta la variable de entorno BACKEND_URL en Vercel. " +
        "Debe apuntar a la URL pública del backend (por ejemplo https://tu-backend.up.railway.app).",
    });
  }

  // `req.url` llega como "/api/auth/login?..." y se reenvía tal cual, porque el
  // backend expone sus rutas bajo el mismo prefijo `/api`.
  const target = `${backend}${req.url || "/api"}`;
  const method = (req.method || "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const body = hasBody ? await readRawBody(req) : undefined;

    const upstream = await fetch(target, {
      method,
      headers: forwardableHeaders(req),
      // `undici` acepta Uint8Array como cuerpo; el cast solo existe porque la
      // definición de `BodyInit` en la lib DOM de TypeScript no lo contempla.
      body: body && body.length > 0 ? (body as unknown as BodyInit) : undefined,
      redirect: "manual",
    });

    const outgoing: Record<string, string> = {};
    upstream.headers.forEach((value, name) => {
      if (HOP_BY_HOP.has(name.toLowerCase())) return;
      // El navegador ya está en el mismo origen: reenviar las cabeceras CORS
      // del backend solo puede provocar valores duplicados.
      if (name.toLowerCase().startsWith("access-control-")) return;
      outgoing[name] = value;
    });

    const payload = new Uint8Array(await upstream.arrayBuffer());
    outgoing["content-length"] = payload.length.toString();
    res.writeHead(upstream.status, outgoing);
    res.end(payload.length > 0 ? Buffer.from(payload) : undefined);
  } catch (cause) {
    console.error(`[PROXY] Falló ${method} ${target}:`, cause);
    sendJson(res, 502, {
      error:
        "No se pudo contactar con el backend. Comprueba que el servicio esté desplegado y que " +
        "BACKEND_URL sea correcta.",
    });
  }
}
