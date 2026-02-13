"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BaseParams {
  q?: string;
  solicitante?: string;
  unResponsavel?: string;
  status?: string;
  agencia?: string;
  mes?: string;
  comprovacao?: string;
}

interface DemandasPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  baseParams: BaseParams;
}

function buildSearchParams(params: BaseParams, targetPage: number, pathname: string): string {
  const sp = new URLSearchParams();
  
  // Adicionar filtros
  if (params.q) sp.set("q", params.q);
  if (params.solicitante) sp.set("solicitante", params.solicitante);
  if (params.unResponsavel) sp.set("unResponsavel", params.unResponsavel);
  if (params.status) sp.set("status", params.status);
  if (params.agencia) sp.set("agencia", params.agencia);
  if (params.mes) sp.set("mes", params.mes);
  if (params.comprovacao) sp.set("comprovacao", params.comprovacao);
  
  // Adicionar page apenas se for maior que 1
  // Se for 1, NUNCA adicionar o parâmetro page (garantir URL limpa)
  if (targetPage > 1) {
    sp.set("page", String(targetPage));
  }
  
  const query = sp.toString();
  
  // Se targetPage === 1 e não há filtros, retornar caminho absoluto para limpar todos os query params
  // Caso contrário, retornar a query string normal
  if (targetPage === 1 && !query) {
    return pathname;
  }
  
  return query ? `?${query}` : "";
}

export function DemandasPagination({
  page,
  totalPages,
  total,
  limit,
  baseParams,
}: DemandasPaginationProps) {
  const pathname = usePathname();
  
  if (total <= 0 || (totalPages <= 1 && total <= limit)) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const prevHref = page > 1 ? buildSearchParams(baseParams, page - 1, pathname) : null;
  const nextHref = page < totalPages ? buildSearchParams(baseParams, page + 1, pathname) : null;

  const pagesToShow: number[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pagesToShow.push(i);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0">
      <p className="text-sm text-slate-600">
        Mostrando {start}–{end} de {total} demandas
      </p>

      <nav
        className="flex items-center gap-1"
        aria-label="Paginação de demandas"
      >
        {prevHref ? (
          <Link
            href={prevHref}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Link>
        ) : (
          <span
            className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400"
            aria-disabled
          >
            <ChevronLeft className="size-4" />
            Anterior
          </span>
        )}

        <div className="flex items-center gap-1">
          {pagesToShow.map((p) => {
            const href = buildSearchParams(baseParams, p, pathname);
            const isCurrent = p === page;
            return isCurrent ? (
              <span
                key={p}
                className="flex size-9 items-center justify-center rounded-lg bg-blue-500 text-sm font-medium text-white"
                aria-current="page"
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={href}
                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                aria-label={`Ir para página ${p}`}
              >
                {p}
              </Link>
            );
          })}
        </div>

        {nextHref ? (
          <Link
            href={nextHref}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            aria-label="Próxima página"
          >
            Próxima
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span
            className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400"
            aria-disabled
          >
            Próxima
            <ChevronRight className="size-4" />
          </span>
        )}
      </nav>
    </div>
  );
}
