import type { Creator, Payment } from "@casa-creadores/shared";
import { Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "../lib/api";
import { toUserMessage } from "../lib/errors";

type CreatorWithUser = Creator & { user: { email: string; createdAt: string } };
type PaymentWithRelations = Payment & { brand: { companyName: string }; campaign: { title: string } };

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

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

function StatBlock({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-t border-border pt-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingCreators, setPendingCreators] = useState<CreatorWithUser[]>([]);
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const [s, creators, p, m] = await Promise.all([
        apiFetch<Stats>("/admin/stats"),
        apiFetch<CreatorWithUser[]>("/admin/creators?status=PENDING"),
        apiFetch<PaymentWithRelations[]>("/admin/payments"),
        apiFetch<ContactMessage[]>("/admin/contact-messages"),
      ]);
      setStats(s);
      setPendingCreators(creators);
      setPayments(p);
      setMessages(m);
    } catch (err) {
      setLoadError(toUserMessage(err, "No pudimos cargar el panel."));
    }
  }

  async function handleToggleMessage(id: string, handled: boolean) {
    await apiFetch(`/admin/contact-messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ handled }),
    });
    loadAll();
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
    <div className="container py-16">
      <h1 className="mb-12 text-2xl font-semibold tracking-tight text-foreground">Panel de administración</h1>

      {loadError && (
        <div className="mb-10 flex flex-wrap items-center gap-4">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadAll}>
            Reintentar
          </Button>
        </div>
      )}

      {stats && (
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Marcas" value={String(stats.totalBrands)} />
          <StatBlock label="Creadores" value={String(stats.totalCreators)} hint={`${stats.pendingCreators} pendientes`} />
          <StatBlock label="Campañas" value={`${stats.activeCampaigns} / ${stats.totalCampaigns}`} hint="activas / totales" />
          <StatBlock
            label="Ingresos"
            value={`$${stats.totalRevenueUSDC.toLocaleString()}`}
            hint={`Comisión: $${stats.platformCommissionUSDC.toFixed(2)} USDC`}
          />
        </div>
      )}

      <Tabs defaultValue="creadores">
        <TabsList>
          <TabsTrigger value="creadores">Creadores pendientes ({pendingCreators.length})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({payments.length})</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes ({messages.filter((m) => !m.handled).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="creadores">
          {pendingCreators.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-sm">No hay creadores pendientes de aprobación.</p>
            </div>
          ) : (
            <div>
              {pendingCreators.map((c) => (
                <div key={c.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 py-5">
                    <div>
                      <p className="font-medium text-foreground">{c.xHandle || c.igHandle || c.user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.user.email} · {c.followerCount.toLocaleString()} seguidores · {c.nichos.join(", ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleVerify(c.id, "VERIFIED")}>
                        Aprobar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleVerify(c.id, "REJECTED")}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagos">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-sm">Aún no hay pagos registrados.</p>
            </div>
          ) : (
            <div>
              {payments.map((p) => (
                <div key={p.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 py-5">
                    <div>
                      <p className="font-medium text-foreground">
                        {p.brand.companyName} → {p.campaign.title}
                      </p>
                      <p className="break-all text-xs text-muted-foreground">{p.txHash}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">${p.amountUSDC.toLocaleString()} USDC</span>
                      <Badge variant={p.status === "COMPLETED" ? "success" : p.status === "FAILED" ? "destructive" : "warning"}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mensajes">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-sm">Aún no hay mensajes de contacto.</p>
            </div>
          ) : (
            <div>
              {messages.map((m) => (
                <div key={m.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3 py-5">
                    <div className="max-w-2xl">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{m.name}</p>
                        <a
                          href={`mailto:${m.email}`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {m.email}
                        </a>
                        {m.handled && <Badge variant="success">Atendido</Badge>}
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{m.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString("es")}
                      </p>
                    </div>
                    <Button
                      variant={m.handled ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleMessage(m.id, !m.handled)}
                    >
                      {m.handled ? "Reabrir" : "Marcar atendido"}
                    </Button>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
