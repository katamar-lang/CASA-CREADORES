import type { Brand, Campaign, Payment } from "@casa-creadores/shared";
import { INDUSTRIAS } from "@casa-creadores/shared";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input, Select } from "../components/Input";
import { apiFetch, ApiError } from "../lib/api";

const STATUS_TONE: Record<string, "yellow" | "green" | "gray" | "blue"> = {
  DRAFT: "gray",
  ACTIVE: "green",
  PAUSED: "yellow",
  COMPLETED: "blue",
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
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <h1 className="mb-1 text-2xl font-bold text-ink">Completa el perfil de tu marca</h1>
        <p className="mb-6 text-sm text-gray-500">Esto toma menos de un minuto.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nombre de la empresa" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input
            label="Sitio web"
            type="url"
            required
            placeholder="https://tuempresa.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <Select label="Industria" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRIAS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </form>
      </Card>
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
    return <div className="py-20 text-center text-gray-500">Cargando...</div>;
  }

  if (brand === null) {
    return <BrandProfileForm onSaved={(b) => { setBrand(b); loadAll(); }} />;
  }

  const totalPaidUSDC = payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amountUSDC, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Hola, {brand.companyName} 👋</h1>
          <p className="text-sm text-gray-500">{brand.industry} · {brand.website}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/marca/creadores">
            <Button variant="outline">Ver creadores</Button>
          </Link>
          <Link to="/marca/campanas/nueva">
            <Button>+ Nueva campaña</Button>
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Campañas totales</p>
          <p className="text-2xl font-bold text-ink">{campaigns.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Campañas activas</p>
          <p className="text-2xl font-bold text-ink">{campaigns.filter((c) => c.status === "ACTIVE").length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total pagado (USDC)</p>
          <p className="text-2xl font-bold text-ink">${totalPaidUSDC.toLocaleString()}</p>
        </Card>
      </div>

      <h2 className="mb-4 text-lg font-bold text-ink">Tus campañas</h2>
      {campaigns.length === 0 ? (
        <Card className="text-center text-gray-500">
          Aún no tienes campañas.{" "}
          <Link to="/marca/campanas/nueva" className="font-semibold text-primary-700 hover:underline">
            Crea la primera
          </Link>
          .
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns.map((c) => {
            const isPaid = payments.some((p) => p.campaignId === c.id && p.status === "COMPLETED");
            return (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Link to={`/campanas/${c.id}`} className="font-semibold text-ink hover:underline">
                      {c.title}
                    </Link>
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                    {isPaid && <Badge tone="blue">Pagada</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">
                    ${c.budgetUSDC.toLocaleString()} USDC · {c.duration} días · min. {c.minFollowers.toLocaleString()} seguidores
                  </p>
                </div>
                {!isPaid && (
                  <Button variant="secondary" disabled={payingId === c.id} onClick={() => handlePay(c)}>
                    {payingId === c.id ? "Procesando..." : "Pagar ahora (USDC)"}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
