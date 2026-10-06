import Link from "next/link";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export function FilterChip({ removeHref, label, children }: { removeHref: string; label: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-0.5 pr-1 pl-2.5 text-xs text-neutral-700">
      {children}
      <Link
        href={removeHref}
        aria-label={`Remover filtro ${label}`}
        className="rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
      >
        <X className="size-3" />
      </Link>
    </span>
  );
}
