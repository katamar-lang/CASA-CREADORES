import type { Creator } from "@casa-creadores/shared";
import { NICHOS_CRIPTO } from "@casa-creadores/shared";
import { BadgeCheck, Inbox, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
    <div className="container py-16">
      <div className="mb-10 max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Creadores sugeridos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Explora creadores hispanohablantes en cripto y fintech.</p>
      </div>

      <div className="mb-10 flex flex-wrap items-end gap-6 border-b border-border pb-6">
        <div className="flex w-56 flex-col gap-2">
          <Label htmlFor="nicho">Nicho</Label>
          <Select id="nicho" value={nicho} onChange={(e) => setNicho(e.target.value)}>
            <option value="">Todos</option>
            {NICHOS_CRIPTO.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Solo verificados
        </label>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando creadores...
        </div>
      ) : creators.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" strokeWidth={1.5} />
          <p className="text-sm">No se encontraron creadores con esos filtros.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <Card key={c.id} className="shadow-none">
              <CardContent className="pt-6">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{c.xHandle || c.igHandle || "Creador"}</p>
                    <p className="text-xs text-muted-foreground">{c.user.email}</p>
                  </div>
                  {c.verifiedStatus === "VERIFIED" ? (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Badge variant="warning">Pendiente</Badge>
                  )}
                </div>
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{c.bio}</p>
                <p className="mb-3 text-sm font-medium text-foreground">{c.followerCount.toLocaleString()} seguidores</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.nichos.map((n) => (
                    <Badge key={n} variant="outline">
                      {n}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
