import { Suspense } from "react";
import Link from "next/link";
import { FileUp } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getAgencyDemandaScope } from "@/lib/agency-demanda-scope";
import { listDemandasPaginatedUseCase } from "@/lib/use-cases/list-demandas-paginated.use-case";
import { getDemandasFilterOptionsUseCase } from "@/lib/use-cases/get-demandas-filter-options.use-case";
import { getDemandaRepository, getSolicitanteRepository, getAgenciaRepository } from "@/lib/repositories";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/cn";
import { integerFormat } from "@/lib/format";
import { formatMonthYearDisplay } from "@/lib/month-year";
import { DemandasTable } from "@/app/sub/DemandasTable";
import { DemandasFilters } from "@/app/sub/DemandasFilters";
import { DemandasHeaderActions } from "@/app/sub/DemandasHeaderActions";
import { DemandasSearchParamsToaster } from "@/app/sub/DemandasSearchParamsToaster";
import {
  COMPROVACAO_LABELS,
  DEMANDA_STATUS_LABELS,
  demandasHref,
  type DemandasListParams,
} from "@/app/sub/demandas-hrefs";

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
  const agencyScope = await getAgencyDemandaScope(session);
  const isAgency = session?.role === "agency";

  const comprovacaoFilter: "comprovado" | "nao_comprovado" | undefined =
    comprovacao === "comprovado" || comprovacao === "nao_comprovado" ? comprovacao : undefined;
  const baseFilters = {
    search: q,
    solicitante,
    unResponsavel,
    status,
    ...(agencyScope ? {} : { agencia }),
    mes,
    comprovacao: comprovacaoFilter,
  };
  const filters = agencyScope ? { ...baseFilters, ...agencyScope } : baseFilters;

  const demandaRepository = getDemandaRepository();
  const solicitanteRepository = getSolicitanteRepository();
  const agenciaRepository = getAgenciaRepository();
  const [result, filterOptions] = await Promise.all([
    listDemandasPaginatedUseCase(
      filters,
      { page, limit: DEFAULT_PAGE_SIZE },
      { demandaRepository }
    ),
    getDemandasFilterOptionsUseCase(agencyScope ?? undefined, {
      demandaRepository,
      solicitanteRepository,
      agenciaRepository,
    }),
  ]);

  const listParams: Omit<DemandasListParams, "page"> = {
    q: q?.trim() || undefined,
    solicitante: solicitante || undefined,
    unResponsavel: unResponsavel || undefined,
    status: status || undefined,
    agencia: agencyScope || isAgency ? undefined : agencia || undefined,
    mes: mes || undefined,
    comprovacao: comprovacaoFilter,
  };
  const without = (key: keyof typeof listParams) => demandasHref({ ...listParams, [key]: undefined });

  const activeChips = [
    { key: "q", label: "busca", value: listParams.q && `“${listParams.q}”` },
    { key: "solicitante", label: "solicitante", value: listParams.solicitante },
    { key: "unResponsavel", label: "un. responsável", value: listParams.unResponsavel },
    {
      key: "status",
      label: "status",
      value: listParams.status && (DEMANDA_STATUS_LABELS[listParams.status] ?? listParams.status),
    },
    {
      key: "comprovacao",
      label: "comprovação",
      value: listParams.comprovacao && COMPROVACAO_LABELS[listParams.comprovacao],
    },
    { key: "mes", label: "mês", value: listParams.mes && formatMonthYearDisplay(listParams.mes) },
    { key: "agencia", label: "agência", value: listParams.agencia },
  ] as const;
  const hasFilters = activeChips.some((chip) => chip.value);

  return (
    <div className="w-full">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <DemandasSearchParamsToaster />
        </Suspense>

        <PageHeader
          title="Demandas"
          description="Pedidos às agências com valor, centro de custo, OC/PI e mês de referência."
          actions={
            <>
              <Link
                href="/demandas/importar"
                className={cn(buttonBaseClassName, buttonVariants.outline, buttonSizes.md)}
              >
                <FileUp className="size-4" aria-hidden />
                Importar
              </Link>
              {!isAgency && <DemandasHeaderActions options={filterOptions} />}
            </>
          }
        />

        <DemandasFilters params={listParams} options={filterOptions} hideAgencyFilter={isAgency} />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="dark" className="px-2.5 py-1">
              <span className="tabular-nums">{integerFormat.format(result.total)}</span>
              {result.total === 1 ? "demanda" : "demandas"}
            </Badge>
            {activeChips.map((chip) =>
              chip.value ? (
                <FilterChip key={chip.key} label={chip.label} removeHref={without(chip.key)}>
                  <span className="opacity-70">{chip.label}:</span> {chip.value}
                </FilterChip>
              ) : null,
            )}
          </div>

          <DemandasTable
            key={removed ? "removed" : "default"}
            demandas={result.items}
            options={filterOptions}
            readOnly={isAgency}
            userRole={session?.role ?? "operator"}
            emptyMessage={hasFilters ? "Nenhuma demanda encontrada para os filtros aplicados." : undefined}
          />

          {result.total > 0 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              pageSize={result.limit}
              hrefForPage={(target) => demandasHref({ ...listParams, page: target })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
