import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="container max-w-2xl py-16">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Nueva campaña</CardTitle>
          <CardDescription>Publícala en menos de 5 minutos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Lanzamiento wallet USDC LATAM"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objetivo de la campaña, tipo de contenido esperado, entregables..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="budget">Presupuesto (USDC)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={1}
                  required
                  value={budgetUSDC}
                  onChange={(e) => setBudgetUSDC(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="duration">Duración (días)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="minFollowers">Seguidores mínimos</Label>
                <Input
                  id="minFollowers"
                  type="number"
                  min={0}
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="minEngagement">Engagement mínimo (%)</Label>
                <Input
                  id="minEngagement"
                  type="number"
                  min={0}
                  step="0.1"
                  value={minEngagementRate}
                  onChange={(e) => setMinEngagementRate(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Publicando..." : "Publicar campaña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
