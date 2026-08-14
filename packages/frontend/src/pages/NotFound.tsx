import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Error 404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Esta página no existe</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Puede que el enlace esté roto o que la página se haya movido.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
