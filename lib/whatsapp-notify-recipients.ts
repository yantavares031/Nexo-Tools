/** Lista salva em `whatsapp_integration.notify_recipients_json`. */

export function parseNotifyRecipientsJson(raw: unknown): string[] {
  if (raw == null) return [];
  const s = String(raw).trim();
  if (!s || s === "[]") return [];
  try {
    const p = JSON.parse(s) as unknown;
    if (!Array.isArray(p)) return [];
    const out: string[] = [];
    for (const item of p) {
      if (typeof item === "string") {
        const t = item.trim();
        if (t) out.push(t);
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function normalizeNotifyRecipientsUnique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
