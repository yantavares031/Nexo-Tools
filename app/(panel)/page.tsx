import { Suspense } from "react";
import { listDemandasUseCase } from "@/lib/use-cases/list-demandas.use-case";
import { getDemandasFilterOptionsUseCase } from "@/lib/use-cases/get-demandas-filter-options.use-case";
import { getDemandaRepository, getSolicitanteRepository, getAgenciaRepository } from "@/lib/repositories";
import { DemandasTable } from "@/app/sub/DemandasTable";
import { DemandasFilters } from "@/app/sub/DemandasFilters";
import { DemandasSearchParamsToaster } from "@/app/sub/DemandasSearchParamsToaster";

export default async function DemandasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    solicitante?: string;
    unResponsavel?: string;
    status?: string;
    agencia?: string;
  }>;
}) {
  const { q, solicitante, unResponsavel, status, agencia, removed } = await searchParams;

  const demandaRepository = getDemandaRepository();
  const solicitanteRepository = getSolicitanteRepository();
  const agenciaRepository = getAgenciaRepository();
  const [demandas, filterOptions] = await Promise.all([
    listDemandasUseCase(
      { search: q, solicitante, unResponsavel, status, agencia },
      { demandaRepository }
    ),
    getDemandasFilterOptionsUseCase({ demandaRepository, solicitanteRepository, agenciaRepository }),
  ]);

  const filterKey = [q, solicitante, unResponsavel, status, agencia].join("|");

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
          <DemandasFilters key={filterKey} options={filterOptions} />
        </Suspense>

        <DemandasTable
          key={removed ? "removed" : "default"}
          demandas={demandas}
          options={filterOptions}
        />
      </div>
    </div>
  );
}
