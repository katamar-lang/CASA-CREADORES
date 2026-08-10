import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input, Select } from "../components/Input";
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
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
        <Card className="w-full text-center">
          <h1 className="mb-2 text-2xl font-bold text-ink">¡Revisa tu email!</h1>
          <p className="mb-4 text-sm text-gray-600">{success.message}</p>
          {success.devVerificationUrl && (
            <div className="mb-4 rounded-lg bg-primary-50 p-3 text-left text-sm">
              <p className="mb-1 font-semibold">Modo desarrollo:</p>
              <Link to={success.devVerificationUrl.replace(window.location.origin, "")} className="break-all text-primary-800 underline">
                {success.devVerificationUrl}
              </Link>
            </div>
          )}
          <Link to="/login" className="font-semibold text-primary-700 hover:underline">
            Ir a iniciar sesión
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <h1 className="mb-1 text-2xl font-bold text-ink">Crea tu cuenta</h1>
        <p className="mb-6 text-sm text-gray-500">Empieza en menos de 3 minutos.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select label="Soy..." value={role} onChange={(e) => setRole(e.target.value as "MARCA" | "CREADOR")}>
            <option value="MARCA">Marca</option>
            <option value="CREADOR">Creador</option>
          </Select>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
          <Input
            label="Contraseña"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
