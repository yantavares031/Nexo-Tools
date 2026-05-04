import { escapeHtml } from "@/lib/email/html-escape";

/**
 * Destaque verde para palavras-chave no corpo dos e-mails transacionais
 * (mesmo padrão em Ordens de compra, comprovações, boas-vindas, etc.).
 */
const KEYWORD_STYLE =
  "font-weight:600;color:#15803d;";

/** Marca uma palavra ou frase curta já escapada como destaque (verde). */
export function emailKeywordHighlight(text: string): string {
  return `<span style="${KEYWORD_STYLE}">${escapeHtml(text)}</span>`;
}

/** Ícone de check em círculo verde (uso em títulos). */
export function emailSuccessCheckIcon(sizePx = 26): string {
  const s = String(sizePx);
  return `<span style="display:inline-block;width:${s}px;height:${s}px;line-height:${s}px;text-align:center;border-radius:9999px;background-color:#dcfce7;color:#16a34a;font-size:${Math.round(sizePx * 0.55)}px;font-weight:700;vertical-align:middle;">&#10003;</span>`;
}

/**
 * Título principal com check verde + texto (fragmento HTML para dentro do &lt;h1&gt;).
 */
export function buildEmailTitleWithSuccessCheck(headlinePlain: string): string {
  const safe = escapeHtml(headlinePlain);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;border-collapse:collapse;"><tr>
<td style="vertical-align:middle;padding:0 12px 0 0;">${emailSuccessCheckIcon(28)}</td>
<td style="vertical-align:middle;padding:0;font-size:18px;font-weight:600;color:#1e293b;line-height:1.35;">${safe}</td>
</tr></table>`;
}
