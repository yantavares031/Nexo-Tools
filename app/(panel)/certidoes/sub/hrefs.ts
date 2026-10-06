export interface CertidoesFilterParams {
  q?: string;
  mes?: string;
  agenciaId?: string;
}

export function certidoesHref({ q, mes, agenciaId, page = 1 }: CertidoesFilterParams & { page?: number }): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (mes) params.set("mes", mes);
  if (agenciaId) params.set("agenciaId", agenciaId);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/certidoes?${query}` : "/certidoes";
}
