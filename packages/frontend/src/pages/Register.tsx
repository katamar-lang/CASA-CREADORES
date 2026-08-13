import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiFetch, ApiError } from "../lib/api";

export function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "CREADOR" ? "CREADOR" : "MARCA";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MARCA" | "CREADOR">(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ message: string; devVerificationUrl?: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ message: string; devVerificationUrl?: string }>("/auth/register", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email, password, role }),
      });
      setSuccess(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] max-w-md items-center py-16">
        <Card className="w-full border-none text-center shadow-none sm:border sm:shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">¡Revisa tu email!</CardTitle>
            <CardDescription>{success.message}</CardDescription>
          </CardHeader>
          <CardContent>
            {success.devVerificationUrl && (
              <div className="mb-6 rounded-md border border-border bg-muted/50 p-3 text-left text-sm">
                <p className="mb-1 font-medium text-foreground">Modo desarrollo:</p>
                <Link to={success.devVerificationUrl.replace(window.location.origin, "")} className="break-all text-muted-foreground underline underline-offset-2">
                  {success.devVerificationUrl}
                </Link>
              </div>
            )}
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
      <Card className="w-full border-none shadow-none sm:border sm:shadow-sm">
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
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
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
