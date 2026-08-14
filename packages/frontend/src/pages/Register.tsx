import type { User } from "@casa-creadores/shared";
import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { toUserMessage } from "../lib/errors";

type RegisterResponse = {
  requiresVerification: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
};

function dashboardPathFor(role: string): string {
  if (role === "MARCA") return "/marca";
  if (role === "CREADOR") return "/creador";
  return "/admin";
}

export function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { adoptSession } = useAuth();
  const initialRole = searchParams.get("role") === "CREADOR" ? "CREADOR" : "MARCA";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MARCA" | "CREADOR">(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email, password, role }),
      });

      // La cuenta quedó activa: entramos directamente al panel.
      if (!data.requiresVerification && data.accessToken && data.refreshToken && data.user) {
        adoptSession(data.accessToken, data.refreshToken, data.user);
        navigate(dashboardPathFor(data.user.role), { replace: true });
        return;
      }

      // Hay proveedor de email configurado: hay que verificar antes de entrar.
      setPendingVerification(data.message);
    } catch (err) {
      setError(toUserMessage(err, "No se pudo crear la cuenta. Inténtalo de nuevo."));
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] max-w-md items-center py-16">
        <Card className="w-full border-none text-center shadow-none sm:border">
          <CardHeader>
            <CardTitle className="text-xl">Revisa tu email</CardTitle>
            <CardDescription>{pendingVerification}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login" className="text-sm font-medium text-foreground hover:underline">
              Ir a iniciar sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-md items-center py-16">
      <Card className="w-full border-none shadow-none sm:border">
        <CardHeader>
          <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
          <CardDescription>Empieza en menos de 3 minutos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Soy...</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value as "MARCA" | "CREADOR")}>
                <option value="MARCA">Marca</option>
                <option value="CREADOR">Creador</option>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <p className="text-xs text-muted-foreground">Al menos 8 caracteres.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
