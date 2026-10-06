import { Suspense } from "react";
import { getSolicitantesPaginatedAction } from "@/app/actions/solicitante";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { Pagination } from "@/components/ui/pagination";
import { SearchPill } from "@/components/ui/search-pill";
import { integerFormat } from "@/lib/format";
import { getUnidades } from "@/lib/unidades";
import { SolicitantesHeader } from "./sub/SolicitantesHeader";
import { SolicitantesTable } from "./sub/SolicitantesTable";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";

const DEFAULT_PAGE_SIZE = 15;

function solicitantesHref({ q, page = 1 }: { q?: string; page?: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/solicitantes?${query}` : "/solicitantes";
}

export default async function SolicitantesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const searchQuery = q?.trim() || undefined;

  const [result, unidades] = await Promise.all([
    getSolicitantesPaginatedAction(page, DEFAULT_PAGE_SIZE, searchQuery),
    getUnidades(),
  ]);

  return (
    <div className="w-full">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <PageHeader
          title="Solicitantes"
          description="Quem pede as demandas e a unidade responsável de cada um."
          actions={<SolicitantesHeader unidades={unidades} />}
        />

        <SearchPill
          action="/solicitantes"
          q={searchQuery}
          placeholder="Buscar por nome ou unidade"
          label="Buscar solicitantes"
          clearHref={solicitantesHref({})}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="dark" className="px-2.5 py-1">
              <span className="tabular-nums">{integerFormat.format(result.total)}</span>
              {result.total === 1 ? "solicitante" : "solicitantes"}
            </Badge>
            {searchQuery && (
              <FilterChip label="busca" removeHref={solicitantesHref({})}>
                “{searchQuery}”
              </FilterChip>
            )}
          </div>

          <SolicitantesTable
            solicitantes={result.items}
            unidades={unidades}
            emptyMessage={searchQuery ? "Nenhum solicitante encontrado para a busca." : undefined}
          />

          {result.total > 0 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              pageSize={result.limit}
              hrefForPage={(target) => solicitantesHref({ q: searchQuery, page: target })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
