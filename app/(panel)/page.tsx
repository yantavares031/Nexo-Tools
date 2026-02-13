import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { listDemandasPaginatedUseCase } from "@/lib/use-cases/list-demandas-paginated.use-case";
import { getDemandasFilterOptionsUseCase } from "@/lib/use-cases/get-demandas-filter-options.use-case";
import { getDemandaRepository, getSolicitanteRepository, getAgenciaRepository } from "@/lib/repositories";
import { DemandasTable } from "@/app/sub/DemandasTable";
import { DemandasFilters } from "@/app/sub/DemandasFilters";
import { DemandasPagination } from "@/app/sub/DemandasPagination";
import { DemandasSearchParamsToaster } from "@/app/sub/DemandasSearchParamsToaster";

const DEFAULT_PAGE_SIZE = 20;

export default async function DemandasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    solicitante?: string;
    unResponsavel?: string;
    status?: string;
    agencia?: string;
    mes?: string;
    comprovacao?: string;
    page?: string;
    removed?: string;
  }>;
}) {
  const { q, solicitante, unResponsavel, status, agencia, mes, comprovacao, page: pageParam, removed } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const session = await getSession();

  const comprovacaoFilter: "comprovado" | "nao_comprovado" | undefined =
    comprovacao === "comprovado" || comprovacao === "nao_comprovado" ? comprovacao : undefined;
  const baseFilters = {
    search: q,
    solicitante,
    unResponsavel,
    status,
    agencia,
    mes,
    comprovacao: comprovacaoFilter,
  };
  const filters =
    session?.role === "agency" && session?.agenciaId
      ? { ...baseFilters, agenciaId: session.agenciaId }
      : baseFilters;

  const demandaRepository = getDemandaRepository();
  const solicitanteRepository = getSolicitanteRepository();
  const agenciaRepository = getAgenciaRepository();
  const [result, filterOptions] = await Promise.all([
    listDemandasPaginatedUseCase(
      filters,
      { page, limit: DEFAULT_PAGE_SIZE },
      { demandaRepository }
    ),
    getDemandasFilterOptionsUseCase(
      session?.role === "agency" && session?.agenciaId
        ? { agenciaId: session.agenciaId }
        : undefined,
      { demandaRepository, solicitanteRepository, agenciaRepository }
    ),
  ]);

  const filterKey = [q, solicitante, unResponsavel, status, agencia, mes, comprovacao, session?.agenciaId].join("|");

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Suspense fallback={null}>
          <DemandasSearchParamsToaster />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-12 animate-pulse rounded-lg bg-slate-200" />
          }
        >
          <DemandasFilters
            key={filterKey}
            options={filterOptions}
            hideAgencyFilter={session?.role === "agency"}
            userRole={session?.role ?? "operator"}
          />
        </Suspense>

        <DemandasTable
          key={removed ? "removed" : "default"}
          demandas={result.items}
          options={filterOptions}
          readOnly={session?.role === "agency"}
          userRole={session?.role ?? "operator"}
        />

        <DemandasPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          baseParams={{ q, solicitante, unResponsavel, status, agencia, mes, comprovacao }}
        />
      </div>
    </div>
  );
}
