import type { BadgeTone } from "@/components/ui/badge";

export type DemandasListParams = {
  q?: string;
  solicitante?: string;
  unResponsavel?: string;
  status?: string;
  agencia?: string;
  mes?: string;
  comprovacao?: string;
  page?: number;
};

const FILTER_KEYS = ["q", "solicitante", "unResponsavel", "status", "agencia", "mes", "comprovacao"] as const;

export function demandasHref(params: DemandasListParams): string {
  const search = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

export const DEMANDA_STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
  entregue: "Entregue",
};

export const DEMANDA_STATUS_TONES: Record<string, BadgeTone> = {
  faturado: "success",
  comprometido: "warning",
  entregue: "info",
};

export const COMPROVACAO_LABELS: Record<string, string> = {
  comprovado: "Com comprovação",
  nao_comprovado: "Sem comprovação",
};
