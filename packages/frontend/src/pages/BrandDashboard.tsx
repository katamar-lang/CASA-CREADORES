import type { Brand, Campaign, Payment } from "@casa-creadores/shared";
import { INDUSTRIAS } from "@casa-creadores/shared";
import { Inbox } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiFetch, ApiError } from "../lib/api";

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "outline",
};

function BrandProfileForm({ onSaved }: { onSaved: (brand: Brand) => void }) {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState<string>(INDUSTRIAS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const brand = await apiFetch<Brand>("/brands/me", {
        method: "PUT",
        body: JSON.stringify({ companyName, website, industry }),
      });
      onSaved(brand);
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
          <CardTitle className="text-xl">Completa el perfil de tu marca</CardTitle>
          <CardDescription>Esto toma menos de un minuto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="companyName">Nombre de la empresa</Label>
              <Input id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                type="url"
                required
                placeholder="https://tuempresa.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="industry">Industria</Label>
              <Select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {INDUSTRIAS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar y continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
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

export function BrandDashboard() {
  const [brand, setBrand] = useState<Brand | null | undefined>(undefined);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function loadAll() {
    try {
      const b = await apiFetch<Brand>("/brands/me");
      setBrand(b);
      const [c, p] = await Promise.all([
        apiFetch<Campaign[]>("/campaigns/mine"),
        apiFetch<Payment[]>("/payments/mine"),
      ]);
      setCampaigns(c);
      setPayments(p);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setBrand(null);
      }
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handlePay(campaign: Campaign) {
    setPayingId(campaign.id);
    try {
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({ campaignId: campaign.id, amountUSDC: campaign.budgetUSDC }),
      });
      const p = await apiFetch<Payment[]>("/payments/mine");
      setPayments(p);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "No se pudo procesar el pago.");
    } finally {
      setPayingId(null);
    }
  }

  if (brand === undefined) {
    return <div className="container py-24 text-center text-sm text-muted-foreground">Cargando...</div>;
  }

  if (brand === null) {
    return (
      <BrandProfileForm
        onSaved={(b) => {
          setBrand(b);
          loadAll();
        }}
      />
    );
  }

  const totalPaidUSDC = payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amountUSDC, 0);

  return (
    <div className="container py-16">
      <div className="mb-12 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{brand.companyName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {brand.industry} · {brand.website}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/marca/creadores">Ver creadores</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/marca/campanas/nueva">Nueva campaña</Link>
          </Button>
        </div>
      </div>

      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <StatBlock label="Campañas totales" value={String(campaigns.length)} />
        <StatBlock label="Campañas activas" value={String(campaigns.filter((c) => c.status === "ACTIVE").length)} />
        <StatBlock label="Total pagado" value={`$${totalPaidUSDC.toLocaleString()}`} hint="USDC" />
      </div>

      <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">Tus campañas</h2>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-t border-border py-24 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" strokeWidth={1.5} />
          <p className="text-sm">
            Aún no tienes campañas.{" "}
            <Link to="/marca/campanas/nueva" className="font-medium text-foreground hover:underline">
              Crea la primera
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="border-t border-border">
          {campaigns.map((c) => {
            const isPaid = payments.some((p) => p.campaignId === c.id && p.status === "COMPLETED");
            return (
              <div key={c.id}>
                <div className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Link to={`/campanas/${c.id}`} className="font-medium text-foreground hover:underline">
                        {c.title}
                      </Link>
                      <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                      {isPaid && <Badge variant="outline">Pagada</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${c.budgetUSDC.toLocaleString()} USDC · {c.duration} días · min.{" "}
                      {c.minFollowers.toLocaleString()} seguidores
                    </p>
                  </div>
                  {!isPaid && (
                    <Button variant="outline" size="sm" disabled={payingId === c.id} onClick={() => handlePay(c)}>
                      {payingId === c.id ? "Procesando..." : "Pagar ahora (USDC)"}
                    </Button>
                  )}
                </div>
                <Separator />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
