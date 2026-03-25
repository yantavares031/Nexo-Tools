import { Suspense } from "react";
import { getSolicitantesPaginatedAction } from "@/app/actions/solicitante";
import { SolicitantesSection } from "./sub/SolicitantesSection";
import { SolicitantesHeader } from "./sub/SolicitantesHeader";
import { SolicitantesPagination } from "./sub/SolicitantesPagination";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";
import { getUnidades } from "@/lib/unidades";

const DEFAULT_PAGE_SIZE = 15;

export default async function SolicitantesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const searchQuery = (q as string)?.trim() || undefined;

  const [result, unidades] = await Promise.all([
    getSolicitantesPaginatedAction(page, DEFAULT_PAGE_SIZE, searchQuery),
    getUnidades(),
  ]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <SolicitantesHeader unidades={unidades} />

        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <SolicitantesSection
          solicitantes={result.items}
          unidades={unidades}
          baseParams={{ q: searchQuery }}
        />

        <SolicitantesPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          baseParams={{ q: searchQuery }}
        />
      </div>
    </div>
  );
}
