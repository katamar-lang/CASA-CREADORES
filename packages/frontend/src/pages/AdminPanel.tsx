import type { Creator, Payment } from "@casa-creadores/shared";
import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";

type CreatorWithUser = Creator & { user: { email: string; createdAt: string } };
type PaymentWithRelations = Payment & { brand: { companyName: string }; campaign: { title: string } };

interface Stats {
  totalBrands: number;
  totalCreators: number;
  pendingCreators: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalPayments: number;
  totalRevenueUSDC: number;
  platformCommissionUSDC: number;
}

export function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingCreators, setPendingCreators] = useState<CreatorWithUser[]>([]);
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [tab, setTab] = useState<"creadores" | "pagos">("creadores");

  async function loadAll() {
    const [s, creators, p] = await Promise.all([
      apiFetch<Stats>("/admin/stats"),
      apiFetch<CreatorWithUser[]>("/admin/creators?status=PENDING"),
      apiFetch<PaymentWithRelations[]>("/admin/payments"),
    ]);
    setStats(s);
    setPendingCreators(creators);
    setPayments(p);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleVerify(id: string, status: "VERIFIED" | "REJECTED") {
    await apiFetch(`/admin/creators/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    loadAll();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-ink">Panel de administración</h1>

      {stats && (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Marcas</p>
            <p className="text-2xl font-bold text-ink">{stats.totalBrands}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Creadores ({stats.pendingCreators} pendientes)</p>
            <p className="text-2xl font-bold text-ink">{stats.totalCreators}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Campañas activas / totales</p>
            <p className="text-2xl font-bold text-ink">
              {stats.activeCampaigns} / {stats.totalCampaigns}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Ingresos totales (USDC)</p>
            <p className="text-2xl font-bold text-ink">${stats.totalRevenueUSDC.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Comisión plataforma: ${stats.platformCommissionUSDC.toFixed(2)}</p>
          </Card>
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-semibold ${tab === "creadores" ? "border-b-2 border-primary text-ink" : "text-gray-500"}`}
          onClick={() => setTab("creadores")}
        >
          Creadores pendientes ({pendingCreators.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold ${tab === "pagos" ? "border-b-2 border-primary text-ink" : "text-gray-500"}`}
          onClick={() => setTab("pagos")}
        >
          Pagos ({payments.length})
        </button>
      </div>

      {tab === "creadores" &&
        (pendingCreators.length === 0 ? (
          <Card className="text-center text-gray-500">No hay creadores pendientes de aprobación.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingCreators.map((c) => (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{c.xHandle || c.igHandle || c.user.email}</p>
                  <p className="text-sm text-gray-500">
                    {c.user.email} · {c.followerCount.toLocaleString()} seguidores · {c.nichos.join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleVerify(c.id, "VERIFIED")}>
                    Aprobar
                  </Button>
                  <Button variant="outline" onClick={() => handleVerify(c.id, "REJECTED")}>
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {tab === "pagos" &&
        (payments.length === 0 ? (
          <Card className="text-center text-gray-500">Aún no hay pagos registrados.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {p.brand.companyName} → {p.campaign.title}
                  </p>
                  <p className="break-all text-xs text-gray-400">{p.txHash}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">${p.amountUSDC.toLocaleString()} USDC</span>
                  <Badge tone={p.status === "COMPLETED" ? "green" : p.status === "FAILED" ? "red" : "yellow"}>
                    {p.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ))}
    </div>
  );
}
