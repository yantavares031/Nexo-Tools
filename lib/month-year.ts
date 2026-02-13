/**
 * Mês/ano: no banco e no domínio usamos sempre o formato YYYY-MM.
 * Na interface exibimos em pt-BR como MM/YYYY.
 */

const YYYY_MM_REGEX = /^\d{4}-\d{2}$/;

/** Converte YYYY-MM para exibição MM/YYYY. Valores em outro formato (legado) são devolvidos como estão. */
export function formatMonthYearDisplay(mes: string): string {
  if (!mes) return "—";
  if (YYYY_MM_REGEX.test(mes)) {
    const [y, m] = mes.split("-");
    return `${m}/${y}`;
  }
  return mes;
}

/**
 * Normaliza valor para o formato do input type="month" (YYYY-MM).
 * Aceita: YYYY-MM, MM/YYYY, DD/MM/YYYY (extrai mês/ano).
 * Retorna string vazia se não conseguir interpretar.
 */
export function parseMonthYearToInput(mes: string): string {
  const t = (mes ?? "").trim();
  if (!t) return "";
  if (YYYY_MM_REGEX.test(t)) return t;
  // MM/YYYY ou MM/YY
  const slash = t.split("/");
  if (slash.length >= 2) {
    const m = slash[0].padStart(2, "0");
    let y = slash[1];
    if (y.length === 2) y = `20${y}`;
    if (m.length <= 2 && y.length === 4) return `${y}-${m}`;
  }
  return "";
}
