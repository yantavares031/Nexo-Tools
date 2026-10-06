import { getOrdensCompraPaginatedAction } from "@/app/actions/ordem-compra";
import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { Pagination } from "@/components/ui/pagination";
import { integerFormat } from "@/lib/format";
import type { UserRole } from "@/types/globals";
import { OrdensCompraTable } from "./OrdensCompraTable";
import { ordensCompraHref, type OrdensCompraTab } from "./hrefs";

const DEFAULT_PAGE_SIZE = 15;

export async function OrdensCompraListBody({
  page,
  q,
  tab,
  userRole,
}: {
  page: number;
  q: string;
  tab: OrdensCompraTab;
  userRole: UserRole;
}) {
  const status = tab === "assinadas" ? "assinada" : "em_aberto";
  const searchQuery = q || undefined;
  const result = await getOrdensCompraPaginatedAction(page, DEFAULT_PAGE_SIZE, {
    q: searchQuery,
    status,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <Badge tone="dark" className="px-2.5 py-1">
          <span className="tabular-nums">{integerFormat.format(result.total)}</span>
          {result.total === 1 ? "ordem de compra" : "ordens de compra"}
        </Badge>
        {tab === "assinadas" && (
          <FilterChip label="status" removeHref={ordensCompraHref({ q: searchQuery })}>
            Assinadas
          </FilterChip>
        )}
        {searchQuery && (
          <FilterChip label="busca" removeHref={ordensCompraHref({ tab })}>
            “{searchQuery}”
          </FilterChip>
        )}
      </div>

      <OrdensCompraTable
        ordens={result.items}
        userRole={userRole}
        tab={tab}
        emptyMessage={searchQuery ? "Nenhuma ordem de compra encontrada para a busca." : undefined}
      />

      {result.total > 0 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.limit}
          hrefForPage={(target) => ordensCompraHref({ q: searchQuery, tab, page: target })}
        />
      )}
    </div>
  );
}
