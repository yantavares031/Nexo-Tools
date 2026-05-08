/**
 * Garante DDI 55 para números BR usados na UAZAPI (`number` em `POST /send/text`).
 * Remove caracteres não numéricos; se já começar com 55, mantém; senão prefixa 55.
 */
export function normalizeBrazilWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}
