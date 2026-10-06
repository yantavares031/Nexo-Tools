import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MetaItem = { label: string; value: ReactNode };

export function MetaList({ items, className }: { items: MetaItem[]; className?: string }) {
  return (
    <dl className={cn("flex flex-wrap gap-x-10 gap-y-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-0.5">
          <dt className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">{item.label}</dt>
          <dd className="text-[13px] font-medium text-neutral-800 tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
