import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input, Textarea } from "../components/Input";
import { apiFetch, ApiError } from "../lib/api";

export function CampaignCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetUSDC, setBudgetUSDC] = useState("1000");
  const [duration, setDuration] = useState("14");
  const [minFollowers, setMinFollowers] = useState("5000");
  const [minEngagementRate, setMinEngagementRate] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const campaign = await apiFetch<{ id: string }>("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          budgetUSDC: Number(budgetUSDC),
          duration: Number(duration),
          minFollowers: Number(minFollowers),
          minEngagementRate: Number(minEngagementRate),
        }),
      });
      navigate(`/campanas/${campaign.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la campaña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <h1 className="mb-1 text-2xl font-bold text-ink">Nueva campaña</h1>
        <p className="mb-6 text-sm text-gray-500">Publícala en menos de 5 minutos.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Título"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Lanzamiento wallet USDC LATAM"
          />
          <Textarea
            label="Descripción"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objetivo de la campaña, tipo de contenido esperado, entregables..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Presupuesto (USDC)"
              type="number"
              min={1}
              required
              value={budgetUSDC}
              onChange={(e) => setBudgetUSDC(e.target.value)}
            />
            <Input
              label="Duración (días)"
              type="number"
              min={1}
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Seguidores mínimos"
              type="number"
              min={0}
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
            />
            <Input
              label="Engagement mínimo (%)"
              type="number"
              min={0}
              step="0.1"
              value={minEngagementRate}
              onChange={(e) => setMinEngagementRate(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Publicando..." : "Publicar campaña"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
