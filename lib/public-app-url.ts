/**
 * URL pública base do app para **links em e-mails** e outros contextos sem `Host` da requisição.
 *
 * Variáveis (ordem de prioridade):
 * 1. `NEXO_PUBLIC_APP_URL` — URL completa, ex.: `https://nexo.sebraelinks.com`
 * 2. `NEXO_HOST` — só domínio (`app.exemplo.com`) ou URL completa; sem protocolo assume `https://`
 * 3. `NEXT_PUBLIC_APP_URL` — fallback alinhado ao restante do projeto
 *
 * Se nenhuma estiver definida, usa `http://localhost:3000` (desenvolvimento).
 */
function trimSlash(s: string): string {
  return s.replace(/\/$/, "");
}

function normalizeFromHost(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) {
    return trimSlash(v);
  }
  return trimSlash(`https://${v}`);
}

/** Base URL síncrona para e-mails e server actions (sem depender de headers). */
export function getPublicAppBaseUrlForEmail(): string {
  const explicit =
    process.env.NEXO_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return trimSlash(explicit);
  }
  const fromHost = normalizeFromHost(process.env.NEXO_HOST ?? "");
  if (fromHost) {
    return fromHost;
  }
  return "http://localhost:3000";
}
