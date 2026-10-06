import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { integerFormat } from "@/lib/format";

export function DropdownItem({
  href,
  active = false,
  count,
  children,
}: {
  href: string;
  active?: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitemradio"
      aria-checked={active}
      className={cn(
        "flex items-center gap-2 rounded-[calc(var(--radius-field)-2px)] px-2.5 py-2 text-sm transition-colors hover:bg-neutral-100",
        active ? "font-medium text-neutral-950" : "text-neutral-600",
      )}
    >
      <Check className={cn("size-4 shrink-0", active ? "text-neutral-950" : "invisible")} aria-hidden />
      <span className="flex-1">{children}</span>
      {count !== undefined && (
        <span className="text-xs text-neutral-400 tabular-nums">{integerFormat.format(count)}</span>
      )}
    </Link>
  );
}
