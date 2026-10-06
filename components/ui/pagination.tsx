import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { integerFormat as numberFormat } from "@/lib/format";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  hrefForPage: (page: number) => string;
};

function pageWindow(page: number, totalPages: number): Array<number | "gap"> {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

const itemClass = "inline-flex h-8 min-w-8 items-center justify-center rounded-field px-2 text-sm transition-colors";

export function Pagination({ page, totalPages, total, pageSize, hrefForPage }: Props) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-4 pt-4">
      <p className="text-[13px] text-neutral-500">
        Mostrando {numberFormat.format(from)}–{numberFormat.format(to)} de {numberFormat.format(total)}
      </p>

      <div className="flex items-center gap-1">
        <PageLink href={page > 1 ? hrefForPage(page - 1) : undefined} label="Página anterior">
          <ChevronLeft className="size-4" />
        </PageLink>

        {pageWindow(page, totalPages).map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-neutral-400">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={hrefForPage(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                itemClass,
                item === page ? "bg-neutral-800 font-medium text-white" : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              {item}
            </Link>
          ),
        )}

        <PageLink href={page < totalPages ? hrefForPage(page + 1) : undefined} label="Próxima página">
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({ href, label, children }: { href?: string; label: string; children: ReactNode }) {
  if (!href) {
    return (
      <span aria-disabled className={cn(itemClass, "text-neutral-300")} aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(itemClass, "text-neutral-600 hover:bg-neutral-100")}>
      {children}
    </Link>
  );
}
