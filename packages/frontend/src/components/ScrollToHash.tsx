import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Los enlaces del tipo "/#como-funciona" cambian de ruta pero el navegador no
// hace scroll por sí solo cuando React Router controla la navegación.
export function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }

    // Esperamos al siguiente frame para que la sección ya esté montada.
    const id = hash.slice(1);
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  return null;
}
