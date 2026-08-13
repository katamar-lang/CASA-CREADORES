import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const dashboardPath = user?.role === "MARCA" ? "/marca" : user?.role === "CREADOR" ? "/creador" : "/admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link to={dashboardPath} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Mi panel
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Iniciar sesión
              </Link>
              <Button asChild size="sm">
                <Link to="/registro">Empezar</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
