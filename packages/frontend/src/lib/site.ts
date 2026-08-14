// Configuración centralizada de enlaces externos del sitio.
//
// Casa Creadores todavía no tiene perfiles sociales publicados. En vez de
// mostrar enlaces falsos (href="#" o URLs inventadas), cada enlace solo se
// renderiza si su variable de entorno está definida en el build.
//
// Para activarlos, define en Vercel (Settings → Environment Variables):
//   VITE_SOCIAL_X          ej. https://x.com/casacreadores
//   VITE_SOCIAL_LINKEDIN   ej. https://www.linkedin.com/company/casacreadores
//   VITE_SOCIAL_INSTAGRAM  ej. https://www.instagram.com/casacreadores
//
// Y vuelve a desplegar: los enlaces aparecerán automáticamente.

function cleanUrl(value: string | undefined): string | null {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  // Solo aceptamos URLs absolutas http(s); cualquier otra cosa se ignora.
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, "");
}

export type SocialLink = {
  id: "x" | "linkedin" | "instagram";
  label: string;
  url: string;
};

export function getSocialLinks(): SocialLink[] {
  const candidates: Array<{ id: SocialLink["id"]; label: string; raw: string | undefined }> = [
    { id: "x", label: "X (Twitter)", raw: import.meta.env.VITE_SOCIAL_X },
    { id: "linkedin", label: "LinkedIn", raw: import.meta.env.VITE_SOCIAL_LINKEDIN },
    { id: "instagram", label: "Instagram", raw: import.meta.env.VITE_SOCIAL_INSTAGRAM },
  ];

  return candidates
    .map(({ id, label, raw }) => {
      const url = cleanUrl(raw);
      return url ? { id, label, url } : null;
    })
    .filter((link): link is SocialLink => link !== null);
}

// Email de contacto público. Si no está configurado, la interfaz usa el
// formulario de contacto interno en vez de mostrar un mailto inventado.
export function getContactEmail(): string | null {
  const value = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? value : null;
}
