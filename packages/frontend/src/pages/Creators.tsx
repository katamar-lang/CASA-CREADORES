import type { Creator } from "@casa-creadores/shared";
import { NICHOS_CRIPTO } from "@casa-creadores/shared";
import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Select } from "../components/Input";
import { apiFetch } from "../lib/api";

type CreatorWithUser = Creator & { user: { email: string; createdAt: string } };

export function Creators() {
  const [creators, setCreators] = useState<CreatorWithUser[]>([]);
  const [nicho, setNicho] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (nicho) params.set("nicho", nicho);
    if (verifiedOnly) params.set("verified", "true");

    setLoading(true);
    apiFetch<CreatorWithUser[]>(`/creators?${params.toString()}`)
      .then(setCreators)
      .finally(() => setLoading(false));
  }, [nicho, verifiedOnly]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-ink">Creadores sugeridos</h1>
      <p className="mb-6 text-sm text-gray-500">Explora creadores hispanohablantes en cripto y fintech.</p>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Select label="Nicho" value={nicho} onChange={(e) => setNicho(e.target.value)}>
            <option value="">Todos</option>
            {NICHOS_CRIPTO.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-ink">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Solo verificados
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando creadores...</p>
      ) : creators.length === 0 ? (
        <Card className="text-center text-gray-500">No se encontraron creadores con esos filtros.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <Card key={c.id}>
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{c.xHandle || c.igHandle || "Creador"}</p>
                  <p className="text-xs text-gray-400">{c.user.email}</p>
                </div>
                <Badge tone={c.verifiedStatus === "VERIFIED" ? "green" : "yellow"}>
                  {c.verifiedStatus === "VERIFIED" ? "Verificado" : "Pendiente"}
                </Badge>
              </div>
              <p className="mb-3 text-sm text-gray-600 line-clamp-3">{c.bio}</p>
              <p className="mb-2 text-sm font-medium text-ink">
                {c.followerCount.toLocaleString()} seguidores
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.nichos.map((n) => (
                  <Badge key={n} tone="gray">
                    {n}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
