import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card";
import { apiFetch, ApiError } from "../lib/api";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Falta el token de verificación en el enlace.");
      return;
    }

    apiFetch<{ message: string }>("/auth/verify", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ token }),
    })
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "No se pudo verificar el email.");
      });
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <Card className="w-full text-center">
        {status === "loading" && <p className="text-gray-500">Verificando tu email...</p>}
        {status === "success" && (
          <>
            <h1 className="mb-2 text-2xl font-bold text-ink">¡Email verificado!</h1>
            <p className="mb-4 text-sm text-gray-600">{message}</p>
            <Link to="/login" className="font-semibold text-primary-700 hover:underline">
              Ir a iniciar sesión
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="mb-2 text-2xl font-bold text-ink">No pudimos verificar tu email</h1>
            <p className="mb-4 text-sm text-red-600">{message}</p>
            <Link to="/registro" className="font-semibold text-primary-700 hover:underline">
              Volver a intentar
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
