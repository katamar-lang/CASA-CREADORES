import type { Campaign, CampaignApplication, Creator } from "@casa-creadores/shared";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { apiFetch, ApiError } from "../lib/api";

type CampaignWithBrand = Campaign & { brand: { companyName: string; industry: string; website: string } };
type ApplicationWithCreator = CampaignApplication & { creator: Creator & { user: { email: string } } };

const STATUS_TONE: Record<string, "yellow" | "green" | "red" | "gray"> = {
  PENDING: "yellow",
  ACCEPTED: "green",
  REJECTED: "red",
};

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null);
  const [applications, setApplications] = useState<ApplicationWithCreator[]>([]);
  const [myApplication, setMyApplication] = useState<CampaignApplication | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const c = await apiFetch<CampaignWithBrand>(`/campaigns/${id}`);
    setCampaign(c);

    if (user?.role === "MARCA") {
      try {
        const apps = await apiFetch<ApplicationWithCreator[]>(`/campaigns/${id}/applications`);
        setApplications(apps);
      } catch {
        setApplications([]);
      }
    }

    if (user?.role === "CREADOR") {
      const myApps = await apiFetch<Array<CampaignApplication & { campaignId: string }>>("/campaigns/mine/applications");
      setMyApplication(myApps.find((a) => a.campaignId === id) || null);
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
      setError(err instanceof ApiError ? err.message : "No se pudo aplicar a la campaña.");
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

  if (!campaign) {
    return <div className="py-20 text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-2xl font-bold text-ink">{campaign.title}</h1>
          <Badge tone="gray">{campaign.status}</Badge>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          {campaign.brand.companyName} · {campaign.brand.industry}
        </p>
        <p className="mb-6 whitespace-pre-line text-gray-700">{campaign.description}</p>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Presupuesto</p>
            <p className="font-semibold">${campaign.budgetUSDC.toLocaleString()} USDC</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Duración</p>
            <p className="font-semibold">{campaign.duration} días</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Min. seguidores</p>
            <p className="font-semibold">{campaign.minFollowers.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Min. engagement</p>
            <p className="font-semibold">{campaign.minEngagementRate}%</p>
          </div>
        </div>

        {user?.role === "CREADOR" && (
          <div>
            {myApplication ? (
              <Badge tone={STATUS_TONE[myApplication.status]}>Ya aplicaste · {myApplication.status}</Badge>
            ) : (
              <Button onClick={handleApply} disabled={applying || campaign.status !== "ACTIVE"}>
                {applying ? "Aplicando..." : "Aplicar a esta campaña"}
              </Button>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </Card>

      {user?.role === "MARCA" && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-ink">Aplicaciones ({applications.length})</h2>
          {applications.length === 0 ? (
            <Card className="text-center text-gray-500">Aún no hay creadores aplicando.</Card>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map((a) => (
                <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{a.creator.xHandle || a.creator.igHandle || a.creator.user.email}</p>
                    <p className="text-sm text-gray-500">
                      {a.creator.followerCount.toLocaleString()} seguidores · {a.creator.nichos.join(", ")}
                    </p>
                    <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                  </div>
                  {a.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => handleDecision(a.id, "ACCEPTED")}>
                        Aceptar
                      </Button>
                      <Button variant="outline" onClick={() => handleDecision(a.id, "REJECTED")}>
                        Rechazar
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
