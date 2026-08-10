import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const dashboardPath = user?.role === "MARCA" ? "/marca" : user?.role === "CREADOR" ? "/creador" : "/admin";

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <span className="inline-block h-3 w-3 rounded-full bg-primary" />
          Casa Creadores
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link to={dashboardPath} className="text-sm font-medium text-ink hover:text-primary-700">
                Mi panel
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink hover:text-primary-700">
                Iniciar sesión
              </Link>
              <Link to="/registro">
                <Button>Empezar gratis</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
