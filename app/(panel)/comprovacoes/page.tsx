import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getComprovacoesPaginatedAction } from "@/app/actions/demanda-comprovacao";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { Pagination } from "@/components/ui/pagination";
import { SearchPill } from "@/components/ui/search-pill";
import { cn } from "@/lib/cn";
import { integerFormat } from "@/lib/format";
import { ComprovacoesTable } from "./sub/ComprovacoesTable";

const DEFAULT_PAGE_SIZE = 15;

function comprovacoesHref({ q, page = 1 }: { q?: string; page?: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/comprovacoes?${query}` : "/comprovacoes";
}

export default async function ComprovacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const searchQuery = q?.trim() || undefined;

  const result = await getComprovacoesPaginatedAction(page, DEFAULT_PAGE_SIZE, { q });

  return (
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader
          title="Comprovações"
          description="Arquivos que comprovam a execução das demandas."
          actions={
            <Link
              href="/comprovacoes/adicionar"
              className={cn(buttonBaseClassName, buttonVariants.primary, buttonSizes.md)}
            >
              <Plus className="size-4" strokeWidth={2.25} aria-hidden />
              Nova comprovação
            </Link>
          }
        />

        <SearchPill
          action="/comprovacoes"
          q={searchQuery}
          placeholder="Buscar pela descrição"
          label="Buscar comprovações"
          clearHref={comprovacoesHref({})}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="dark" className="px-2.5 py-1">
              <span className="tabular-nums">{integerFormat.format(result.total)}</span>
              {result.total === 1 ? "comprovação" : "comprovações"}
            </Badge>
            {searchQuery && (
              <FilterChip label="busca" removeHref={comprovacoesHref({})}>
                “{searchQuery}”
              </FilterChip>
            )}
          </div>

          <ComprovacoesTable
            comprovacoes={result.items}
            userRole={session.role}
            emptyMessage={searchQuery ? "Nenhuma comprovação encontrada para a busca." : undefined}
          />

          {result.total > 0 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              pageSize={result.limit}
              hrefForPage={(target) => comprovacoesHref({ q: searchQuery, page: target })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
