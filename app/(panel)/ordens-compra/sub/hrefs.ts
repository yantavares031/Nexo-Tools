export type OrdensCompraTab = "abertas" | "assinadas";

export const ORDENS_COMPRA_TAB_OPTIONS: { value: OrdensCompraTab; label: string }[] = [
  { value: "abertas", label: "Em aberto" },
  { value: "assinadas", label: "Assinadas" },
];

export function parseOrdensCompraTab(value: string | undefined): OrdensCompraTab {
  return value === "assinadas" ? "assinadas" : "abertas";
}

export function ordensCompraHref({
  q,
  tab = "abertas",
  page = 1,
}: {
  q?: string;
  tab?: OrdensCompraTab;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (tab === "assinadas") params.set("tab", "assinadas");
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/ordens-compra?${query}` : "/ordens-compra";
}
