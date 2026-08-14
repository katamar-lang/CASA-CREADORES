import type { Campaign, CampaignApplication, Creator } from "@casa-creadores/shared";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { toUserMessage } from "../lib/errors";

type CampaignWithBrand = Campaign & { brand: { companyName: string; industry: string; website: string } };
type ApplicationWithCreator = CampaignApplication & { creator: Creator & { user: { email: string } } };

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null);
  const [applications, setApplications] = useState<ApplicationWithCreator[]>([]);
  const [myApplication, setMyApplication] = useState<CampaignApplication | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoadError(null);
    try {
      const c = await apiFetch<CampaignWithBrand>(`/campaigns/${id}`);
      setCampaign(c);

      if (user?.role === "MARCA") {
        try {
          const apps = await apiFetch<ApplicationWithCreator[]>(`/campaigns/${id}/applications`);
          setApplications(apps);
        } catch {
          // La campaña puede pertenecer a otra marca: no es un error de pantalla.
          setApplications([]);
        }
      }

      if (user?.role === "CREADOR") {
        const myApps = await apiFetch<Array<CampaignApplication & { campaignId: string }>>(
          "/campaigns/mine/applications"
        );
        setMyApplication(myApps.find((a) => a.campaignId === id) || null);
      }
    } catch (err) {
      setLoadError(toUserMessage(err, "No pudimos cargar esta campaña."));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function handleApply() {
    if (!id) return;
    setApplying(true);
    setError(null);
    try {
      const app = await apiFetch<CampaignApplication>(`/campaigns/${id}/apply`, { method: "POST" });
      setMyApplication(app);
    } catch (err) {
      setError(toUserMessage(err, "No se pudo aplicar a la campaña."));
    } finally {
      setApplying(false);
    }
  }

  async function handleDecision(appId: string, status: "ACCEPTED" | "REJECTED") {
    if (!id) return;
    await apiFetch(`/campaigns/${id}/applications/${appId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loadError) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button variant="outline" size="sm" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!campaign) {
    return <div className="container py-24 text-center text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="container max-w-3xl py-16">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{campaign.title}</h1>
        <Badge variant="secondary">{campaign.status}</Badge>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        {campaign.brand.companyName} · {campaign.brand.industry}
      </p>
      <p className="mb-10 whitespace-pre-line leading-relaxed text-foreground">{campaign.description}</p>

      <div className="mb-10 grid grid-cols-2 gap-6 border-y border-border py-6 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Presupuesto</p>
          <p className="mt-1 font-medium text-foreground">${campaign.budgetUSDC.toLocaleString()} USDC</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Duración</p>
          <p className="mt-1 font-medium text-foreground">{campaign.duration} días</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Min. seguidores</p>
          <p className="mt-1 font-medium text-foreground">{campaign.minFollowers.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Min. engagement</p>
          <p className="mt-1 font-medium text-foreground">{campaign.minEngagementRate}%</p>
        </div>
      </div>

      {user?.role === "CREADOR" && (
        <div className="mb-12">
          {myApplication ? (
            <Badge variant={STATUS_VARIANT[myApplication.status]}>Ya aplicaste · {myApplication.status}</Badge>
          ) : (
            <Button onClick={handleApply} disabled={applying || campaign.status !== "ACTIVE"}>
              {applying ? "Aplicando..." : "Aplicar a esta campaña"}
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      )}

      {user?.role === "MARCA" && (
        <div>
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Aplicaciones ({applications.length})
          </h2>
          {applications.length === 0 ? (
            <p className="border-t border-border py-8 text-sm text-muted-foreground">Aún no hay creadores aplicando.</p>
          ) : (
            <div className="border-t border-border">
              {applications.map((a) => (
                <div key={a.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 py-5">
                    <div>
                      <p className="font-medium text-foreground">{a.creator.xHandle || a.creator.igHandle || a.creator.user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.creator.followerCount.toLocaleString()} seguidores · {a.creator.nichos.join(", ")}
                      </p>
                      <Badge variant={STATUS_VARIANT[a.status]} className="mt-2">
                        {a.status}
                      </Badge>
                    </div>
                    {a.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleDecision(a.id, "ACCEPTED")}>
                          Aceptar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDecision(a.id, "REJECTED")}>
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
