"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type OrdensCompraTab = "abertas" | "assinadas";

interface OrdensCompraPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  q?: string;
  tab: OrdensCompraTab;
}

function buildHref(
  pathname: string,
  targetPage: number,
  opts: { q?: string; tab: OrdensCompraTab }
): string {
  const params = new URLSearchParams();
  if (opts.tab === "assinadas") params.set("tab", "assinadas");
  if (opts.q) params.set("q", opts.q);
  if (targetPage > 1) params.set("page", String(targetPage));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function OrdensCompraPagination({
  page,
  totalPages,
  total,
  limit,
  q,
  tab,
}: OrdensCompraPaginationProps) {
  const pathname = usePathname();

  if (total <= 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const prevHref = page > 1 ? buildHref(pathname, page - 1, { q, tab }) : null;
  const nextHref = page < totalPages ? buildHref(pathname, page + 1, { q, tab }) : null;

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
        Mostrando {start}–{end} de {total} pedidos
      </p>

      <nav className="flex items-center gap-1" aria-label="Paginação de ordens de compra">
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
            const href = buildHref(pathname, p, { q, tab });
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
