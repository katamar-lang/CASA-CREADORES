import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL_INFO, apiFetch, getActiveApiUrl } from "@/lib/api";
import { toUserMessage } from "@/lib/errors";
import { getSocialLinks } from "@/lib/site";

// Página de diagnóstico: responde "¿está la web hablando con el backend?" sin
// tener que abrir las herramientas de desarrollo. Existe porque el fallo que
// tumbó producción (una URL de API mal configurada) era invisible desde la
// interfaz: todas las pantallas mostraban el mismo error de conexión genérico.

type HealthResponse = {
  status: string;
  service: string;
  allowedOrigins?: string[];
  emailDelivery?: string;
};

type Probe =
  | { state: "loading" }
  | { state: "ok"; health: HealthResponse; ms: number }
  | { state: "error"; message: string };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-56 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="break-all font-mono text-sm text-foreground">{value}</span>
    </div>
  );
}

export function Diagnostics() {
  const [probe, setProbe] = useState<Probe>({ state: "loading" });
  const socialLinks = getSocialLinks();

  useEffect(() => {
    const startedAt = performance.now();
    apiFetch<HealthResponse>("/health", { skipAuth: true })
      .then((health) => setProbe({ state: "ok", health, ms: Math.round(performance.now() - startedAt) }))
      .catch((err) => setProbe({ state: "error", message: toUserMessage(err) }));
  }, []);

  return (
    <div className="container max-w-2xl py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Diagnóstico</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Estado de la conexión entre esta web y la API.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Conexión con la API</CardTitle>
          <CardDescription>
            {probe.state === "loading" && "Comprobando..."}
            {probe.state === "ok" && `Backend accesible (${probe.ms} ms).`}
            {probe.state === "error" && probe.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Row label="URL de la API en uso" value={getActiveApiUrl()} />
          <Row label="Origen de la configuración" value={API_URL_INFO.source} />
          <Row label="Origen de la web" value={window.location.origin} />
          {probe.state === "ok" && (
            <>
              <Row label="Servicio" value={probe.health.service ?? "—"} />
              <Row label="Estado" value={probe.health.status ?? "—"} />
              <Row label="Verificación por email" value={probe.health.emailDelivery ?? "—"} />
              <Row label="Orígenes CORS permitidos" value={(probe.health.allowedOrigins ?? []).join(", ") || "—"} />
            </>
          )}
          {API_URL_INFO.warnings.map((warning) => (
            <p key={warning} className="pt-3 text-sm text-destructive">
              {warning}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Redes sociales</CardTitle>
          <CardDescription>
            {socialLinks.length > 0
              ? "Enlaces activos en el pie de página."
              : "Sin configurar: el pie de página no muestra iconos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {socialLinks.map(({ id, label, url }) => (
            <Row key={id} label={label} value={url} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
