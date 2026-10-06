import { Suspense } from "react";
import { listAgenciasUseCase } from "@/lib/use-cases/list-agencias.use-case";
import { getAgenciaRepository, getDeskfyImportBoardRepository } from "@/lib/repositories";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { SearchPill } from "@/components/ui/search-pill";
import { integerFormat } from "@/lib/format";
import { AgenciasHeader } from "./sub/AgenciasHeader";
import { AgenciasTable } from "./sub/AgenciasTable";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";

function agenciasHref({ q }: { q?: string }) {
  return q ? `/agencias?${new URLSearchParams({ q })}` : "/agencias";
}

export default async function AgenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const searchQuery = q?.trim() || undefined;

  const [agenciaRepository, boardRepository] = [
    getAgenciaRepository(),
    getDeskfyImportBoardRepository(),
  ];
  const [agencias, boards] = await Promise.all([
    listAgenciasUseCase({ agenciaRepository }),
    boardRepository.findAll(),
  ]);

  const term = searchQuery?.toLowerCase();
  const termDigits = term?.replace(/\D/g, "");
  const filtered = term
    ? agencias.filter(
        (agencia) =>
          agencia.nomeFantasia.toLowerCase().includes(term) ||
          (!!termDigits && agencia.cnpj.replace(/\D/g, "").includes(termDigits)),
      )
    : agencias;

  return (
    <div className="w-full">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <PageHeader
          title="Agências"
          description="Fornecedores que executam as demandas e o orçamento anual de cada um."
          actions={<AgenciasHeader boards={boards} />}
        />

        <SearchPill
          action="/agencias"
          q={searchQuery}
          placeholder="Buscar por nome ou CNPJ"
          label="Buscar agências"
          clearHref={agenciasHref({})}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="dark" className="px-2.5 py-1">
              <span className="tabular-nums">{integerFormat.format(filtered.length)}</span>
              {filtered.length === 1 ? "agência" : "agências"}
            </Badge>
            {searchQuery && (
              <FilterChip label="busca" removeHref={agenciasHref({})}>
                “{searchQuery}”
              </FilterChip>
            )}
          </div>

          <AgenciasTable
            agencias={filtered}
            boards={boards}
            emptyMessage={searchQuery ? "Nenhuma agência encontrada para a busca." : undefined}
          />
        </div>
      </div>
    </div>
  );
}
