import type { Campaign, CampaignApplication, Creator } from "@casa-creadores/shared";
import { NICHOS_CRIPTO } from "@casa-creadores/shared";
import { BadgeCheck, Inbox } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "../lib/api";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

function CreatorProfileForm({ initial, onSaved }: { initial?: Creator; onSaved: (creator: Creator) => void }) {
  const [bio, setBio] = useState(initial?.bio || "");
  const [xHandle, setXHandle] = useState(initial?.xHandle || "");
  const [igHandle, setIgHandle] = useState(initial?.igHandle || "");
  const [tiktokHandle, setTiktokHandle] = useState(initial?.tiktokHandle || "");
  const [followerCount, setFollowerCount] = useState(String(initial?.followerCount ?? 0));
  const [nichos, setNichos] = useState<string[]>(initial?.nichos || []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleNicho(n: string) {
    setNichos((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].slice(0, 5)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const creator = await apiFetch<Creator>("/creators/me", {
        method: "PUT",
        body: JSON.stringify({
          bio,
          xHandle: xHandle || null,
          igHandle: igHandle || null,
          tiktokHandle: tiktokHandle || null,
          followerCount: Number(followerCount),
          nichos,
        }),
      });
      onSaved(creator);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-lg py-16">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">{initial ? "Actualiza tu perfil" : "Completa tu perfil"}</CardTitle>
          <CardDescription>Así te encuentran las marcas en menos de 3 minutos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntanos sobre tu contenido..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="x">X (Twitter)</Label>
                <Input id="x" value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@usuario" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ig">Instagram</Label>
                <Input id="ig" value={igHandle} onChange={(e) => setIgHandle(e.target.value)} placeholder="usuario" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input id="tiktok" value={tiktokHandle} onChange={(e) => setTiktokHandle(e.target.value)} placeholder="usuario" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="followers">Total de seguidores (aprox.)</Label>
              <Input
                id="followers"
                type="number"
                min={0}
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Nichos (máx. 5)</Label>
              <div className="flex flex-wrap gap-2">
                {NICHOS_CRIPTO.map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => toggleNicho(n)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      nichos.includes(n)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function CreatorDashboard() {
  const [creator, setCreator] = useState<Creator | null | undefined>(undefined);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Array<CampaignApplication & { campaign: Campaign }>>([]);
  const [editing, setEditing] = useState(false);

  async function loadAll() {
    try {
      const c = await apiFetch<Creator>("/creators/me");
      setCreator(c);
      const [camps, apps] = await Promise.all([
        apiFetch<Campaign[]>("/campaigns"),
        apiFetch<Array<CampaignApplication & { campaign: Campaign }>>("/campaigns/mine/applications"),
      ]);
      setCampaigns(camps);
      setApplications(apps);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCreator(null);
      }
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (creator === undefined) {
    return <div className="container py-24 text-center text-sm text-muted-foreground">Cargando...</div>;
  }

  if (creator === null || editing) {
    return (
      <CreatorProfileForm
        initial={creator || undefined}
        onSaved={(c) => {
          setCreator(c);
          setEditing(false);
          loadAll();
        }}
      />
    );
  }

  const appliedIds = new Set(applications.map((a) => a.campaignId));

  return (
    <div className="container py-16">
      <div className="mb-12 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {creator.xHandle || creator.igHandle || "Tu perfil"}
            </h1>
            {creator.verifiedStatus === "VERIFIED" && <BadgeCheck className="h-5 w-5 text-emerald-600" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {creator.followerCount.toLocaleString()} seguidores ·{" "}
            {creator.verifiedStatus === "VERIFIED" ? "Verificado" : "Pendiente de aprobación"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Editar perfil
        </Button>
      </div>

      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Tus aplicaciones</h2>
      {applications.length === 0 ? (
        <p className="mb-12 border-t border-border py-8 text-sm text-muted-foreground">
          Aún no has aplicado a ninguna campaña.
        </p>
      ) : (
        <div className="mb-12 border-t border-border">
          {applications.map((a) => (
            <div key={a.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                <Link to={`/campanas/${a.campaign.id}`} className="font-medium text-foreground hover:underline">
                  {a.campaign.title}
                </Link>
                <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
              </div>
              <Separator />
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">Campañas activas</h2>
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-t border-border py-24 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" strokeWidth={1.5} />
          <p className="text-sm">No hay campañas activas por ahora. Vuelve pronto.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="shadow-none">
              <CardContent className="pt-6">
                <Link to={`/campanas/${c.id}`} className="font-medium text-foreground hover:underline">
                  {c.title}
                </Link>
                <p className="my-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                <p className="mb-3 text-sm font-medium text-foreground">${c.budgetUSDC.toLocaleString()} USDC</p>
                {appliedIds.has(c.id) ? (
                  <Badge variant="outline">Ya aplicaste</Badge>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/campanas/${c.id}`}>Ver y aplicar</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
