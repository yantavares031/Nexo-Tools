import { Suspense } from "react";
import { listCentrosCustoAction } from "@/app/actions/centro-custo";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { SearchPill } from "@/components/ui/search-pill";
import { integerFormat } from "@/lib/format";
import { CentrosCustoHeader } from "./sub/CentrosCustoHeader";
import { CentrosCustoTable } from "./sub/CentrosCustoTable";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CentrosCustoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const searchQuery = q?.trim() || undefined;

  const result = await listCentrosCustoAction();
  const centrosCusto = result.centrosCusto || [];

  const term = searchQuery?.toLowerCase();
  const filtered = term ? centrosCusto.filter((cc) => cc.nome.toLowerCase().includes(term)) : centrosCusto;

  return (
    <div className="w-full">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <PageHeader
          title="Centros de custo"
          description="Centros usados no rateio do valor das demandas."
          actions={<CentrosCustoHeader />}
        />

        <SearchPill
          action="/centros-custo"
          q={searchQuery}
          placeholder="Buscar por nome"
          label="Buscar centros de custo"
          clearHref="/centros-custo"
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="dark" className="px-2.5 py-1">
              <span className="tabular-nums">{integerFormat.format(filtered.length)}</span>
              {filtered.length === 1 ? "centro de custo" : "centros de custo"}
            </Badge>
            {searchQuery && (
              <FilterChip label="busca" removeHref="/centros-custo">
                “{searchQuery}”
              </FilterChip>
            )}
          </div>

          <CentrosCustoTable
            centrosCusto={filtered}
            emptyMessage={searchQuery ? "Nenhum centro de custo encontrado para a busca." : undefined}
          />
        </div>
      </div>
    </div>
  );
}
