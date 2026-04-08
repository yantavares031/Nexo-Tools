/** Exibe chaves do briefing Deskfy: `_` → espaço e primeira letra maiúscula. */
export function formatDeskfyBriefingFieldLabel(key: string): string {
  const s = key.replaceAll("_", " ").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
