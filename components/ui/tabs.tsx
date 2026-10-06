import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { integerFormat } from "@/lib/format";

export type TabItem = {
  label: string;
  href: string;
  active: boolean;
  icon?: ReactNode;
  count?: number;
};

export function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  return (
    <nav aria-label={label} className="border-b border-neutral-200">
      <ul className="-mb-px flex gap-7 overflow-x-auto">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 border-b-2 px-1 pb-3 text-sm whitespace-nowrap transition-colors [&_svg]:size-4",
                item.active
                  ? "border-accent font-medium text-neutral-950"
                  : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-950",
              )}
            >
              {item.icon}
              {item.label}
              {item.count !== undefined && (
                <span className="text-neutral-400 tabular-nums">{integerFormat.format(item.count)}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
