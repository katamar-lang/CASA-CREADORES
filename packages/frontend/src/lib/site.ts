// Configuración centralizada de enlaces externos del sitio.
//
// Los perfiles que existen de verdad van aquí como valor por defecto, para que
// el footer los muestre sin depender de ninguna variable en Vercel. Los que
// todavía no existen se quedan vacíos y simplemente no se renderizan: es
// preferible a un icono que enlaza a href="#" o a un perfil inventado.
//
// Cada uno se puede sobrescribir sin tocar código con VITE_SOCIAL_X,
// VITE_SOCIAL_LINKEDIN o VITE_SOCIAL_INSTAGRAM.

/** Perfiles publicados de Casa Creadores. Vacío = todavía no existe. */
const DEFAULT_SOCIAL_URLS = {
  x: "https://x.com/casadecrear",
  linkedin: "",
  instagram: "",
} as const;

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
    { id: "x", label: "X (Twitter)", raw: import.meta.env.VITE_SOCIAL_X || DEFAULT_SOCIAL_URLS.x },
    { id: "linkedin", label: "LinkedIn", raw: import.meta.env.VITE_SOCIAL_LINKEDIN || DEFAULT_SOCIAL_URLS.linkedin },
    {
      id: "instagram",
      label: "Instagram",
      raw: import.meta.env.VITE_SOCIAL_INSTAGRAM || DEFAULT_SOCIAL_URLS.instagram,
    },
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
