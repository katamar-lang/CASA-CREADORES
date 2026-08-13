import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-md items-center py-16">
      <Card className="w-full border-none text-center shadow-none sm:border sm:shadow-sm">
        {status === "loading" && (
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verificando tu email...</p>
          </CardContent>
        )}
        {status === "success" && (
          <>
            <CardHeader className="items-center">
              <CircleCheck className="mb-2 h-8 w-8 text-emerald-600" strokeWidth={1.5} />
              <CardTitle className="text-xl">¡Email verificado!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">{message}</p>
              <Link to="/login" className="text-sm font-medium text-foreground hover:underline">
                Ir a iniciar sesión
              </Link>
            </CardContent>
          </>
        )}
        {status === "error" && (
          <>
            <CardHeader className="items-center">
              <CircleAlert className="mb-2 h-8 w-8 text-destructive" strokeWidth={1.5} />
              <CardTitle className="text-xl">No pudimos verificar tu email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-destructive">{message}</p>
              <Link to="/registro" className="text-sm font-medium text-foreground hover:underline">
                Volver a intentar
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
