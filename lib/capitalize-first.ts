/**
 * Normaliza string para ter apenas a primeira letra maiúscula.
 * Ex.: "ROTA DAS EMOÇÕES" → "Rota das emoções"
 */
export function capitalizeFirst(str: string): string {
  const s = str.trim();
  if (!s) return str;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
