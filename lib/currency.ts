/**
 * Utilitários para valores em Real (R$) no formato brasileiro.
 * Formato: 1.234,56 (ponto para milhares, vírgula para decimais)
 */

export function formatBrazilianCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseBrazilianCurrency(str: string): number {
  if (!str || typeof str !== "string") return 0;
  const cleaned = str
    .replace(/\s/g, "")
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleaned) || 0;
}
