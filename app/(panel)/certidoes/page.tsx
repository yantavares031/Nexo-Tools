import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getCertidoesPaginatedAction } from "@/app/actions/certidao";
import { getAgenciaRepository } from "@/lib/repositories";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { Pagination } from "@/components/ui/pagination";
import { SearchPill } from "@/components/ui/search-pill";
import { cn } from "@/lib/cn";
import { integerFormat } from "@/lib/format";
import { formatMonthYearDisplay } from "@/lib/month-year";
import { CertidoesTable } from "./sub/CertidoesTable";
import { CertidoesFilters } from "./sub/CertidoesFilters";
import { certidoesHref } from "./sub/hrefs";

const DEFAULT_PAGE_SIZE = 15;

export default async function CertidoesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; mes?: string; agenciaId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { page: pageParam, q, mes, agenciaId: agenciaIdParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const qValue = (q ?? "").trim();
  const mesValue = (mes ?? "").trim();
  const agenciaIdValue = (agenciaIdParam ?? "").trim();

  const showAgencyFilter = session.role === "admin";

  const filters = {
    q: qValue || undefined,
    mes: mesValue || undefined,
    agenciaId: showAgencyFilter ? agenciaIdValue || undefined : undefined,
  };

  const result = await getCertidoesPaginatedAction(page, DEFAULT_PAGE_SIZE, filters);

  const agencias =
    showAgencyFilter ?
      (await getAgenciaRepository().findAll())
        .map((a) => ({ id: a.id, nomeFantasia: a.nomeFantasia }))
        .sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia, "pt-BR"))
    : [];

  const agenciaSelecionada = agencias.find((a) => a.id === filters.agenciaId);
  const hasFilters = Boolean(filters.q || filters.mes || filters.agenciaId);

  return (
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader
          title="Certidões"
          description="Certidões de regularidade e seus arquivos."
          actions={
            <Link href="/certidoes/adicionar" className={cn(buttonBaseClassName, buttonVariants.primary, buttonSizes.md)}>
              <Plus className="size-4" strokeWidth={2.25} aria-hidden />
              Nova certidão
            </Link>
          }
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchPill
            action="/certidoes"
            q={filters.q}
            placeholder="Buscar pela descrição (ex.: RFB, FGTS)"
            label="Buscar certidões"
            hiddenParams={{ mes: filters.mes, agenciaId: filters.agenciaId }}
            clearHref={certidoesHref({ ...filters, q: undefined })}
          />
          <CertidoesFilters filters={filters} agencias={agencias} hideAgencyFilter={!showAgencyFilter} />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="dark" className="px-2.5 py-1">
              <span className="tabular-nums">{integerFormat.format(result.total)}</span>
              {result.total === 1 ? "certidão" : "certidões"}
            </Badge>
            {filters.q && (
              <FilterChip label="busca" removeHref={certidoesHref({ ...filters, q: undefined })}>
                “{filters.q}”
              </FilterChip>
            )}
            {filters.mes && (
              <FilterChip label="mês" removeHref={certidoesHref({ ...filters, mes: undefined })}>
                Mês: {formatMonthYearDisplay(filters.mes)}
              </FilterChip>
            )}
            {filters.agenciaId && (
              <FilterChip label="agência" removeHref={certidoesHref({ ...filters, agenciaId: undefined })}>
                Agência: {agenciaSelecionada?.nomeFantasia ?? "—"}
              </FilterChip>
            )}
          </div>

          <CertidoesTable
            certidoes={result.items}
            userRole={session.role}
            emptyMessage={hasFilters ? "Nenhuma certidão encontrada para os filtros aplicados." : undefined}
          />

          {result.total > 0 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              pageSize={result.limit}
              hrefForPage={(target) => certidoesHref({ ...filters, page: target })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
