import type { Campaign, CampaignApplication, Creator } from "@casa-creadores/shared";
import { NICHOS_CRIPTO } from "@casa-creadores/shared";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input, Textarea } from "../components/Input";
import { apiFetch, ApiError } from "../lib/api";

const STATUS_TONE: Record<string, "yellow" | "green" | "red" | "gray"> = {
  PENDING: "yellow",
  ACCEPTED: "green",
  REJECTED: "red",
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
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <h1 className="mb-1 text-2xl font-bold text-ink">{initial ? "Actualiza tu perfil" : "Completa tu perfil"}</h1>
        <p className="mb-6 text-sm text-gray-500">Así te encuentran las marcas en menos de 3 minutos.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntanos sobre tu contenido..." />
          <div className="grid grid-cols-3 gap-3">
            <Input label="X (Twitter)" value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@usuario" />
            <Input label="Instagram" value={igHandle} onChange={(e) => setIgHandle(e.target.value)} placeholder="usuario" />
            <Input label="TikTok" value={tiktokHandle} onChange={(e) => setTiktokHandle(e.target.value)} placeholder="usuario" />
          </div>
          <Input
            label="Total de seguidores (aprox.)"
            type="number"
            min={0}
            value={followerCount}
            onChange={(e) => setFollowerCount(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Nichos (máx. 5)</label>
            <div className="flex flex-wrap gap-2">
              {NICHOS_CRIPTO.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => toggleNicho(n)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    nichos.includes(n)
                      ? "border-primary-600 bg-primary text-ink"
                      : "border-gray-300 text-gray-600 hover:border-primary-400",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Guardando..." : "Guardar perfil"}
          </Button>
        </form>
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
    return <div className="py-20 text-center text-gray-500">Cargando...</div>;
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Hola, {creator.xHandle || creator.igHandle || "creador"} 👋</h1>
          <p className="text-sm text-gray-500">
            {creator.followerCount.toLocaleString()} seguidores ·{" "}
            <Badge tone={creator.verifiedStatus === "VERIFIED" ? "green" : "yellow"}>
              {creator.verifiedStatus === "VERIFIED" ? "Verificado" : "Pendiente de aprobación"}
            </Badge>
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          Editar perfil
        </Button>
      </div>

      <h2 className="mb-4 text-lg font-bold text-ink">Tus aplicaciones</h2>
      {applications.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">Aún no has aplicado a ninguna campaña.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {applications.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3">
              <Link to={`/campanas/${a.campaign.id}`} className="font-semibold text-ink hover:underline">
                {a.campaign.title}
              </Link>
              <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold text-ink">Campañas activas</h2>
      {campaigns.length === 0 ? (
        <Card className="text-center text-gray-500">No hay campañas activas por ahora. Vuelve pronto.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <Link to={`/campanas/${c.id}`} className="font-semibold text-ink hover:underline">
                {c.title}
              </Link>
              <p className="my-2 line-clamp-2 text-sm text-gray-600">{c.description}</p>
              <p className="mb-2 text-sm font-medium text-ink">${c.budgetUSDC.toLocaleString()} USDC</p>
              {appliedIds.has(c.id) ? (
                <Badge tone="blue">Ya aplicaste</Badge>
              ) : (
                <Link to={`/campanas/${c.id}`}>
                  <Button variant="outline">Ver y aplicar</Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
