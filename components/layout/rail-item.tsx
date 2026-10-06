import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const railItemClassName =
  "relative flex h-10 w-full items-center gap-3 rounded-lg px-[11px] text-sm whitespace-nowrap transition-colors";

export const railSubItemClassName =
  "relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] whitespace-nowrap transition-colors";

export const railFadeClassName =
  "transition-opacity duration-200 lg:opacity-0 lg:group-hover/rail:opacity-100 lg:group-has-[:focus-visible]/rail:opacity-100";

export function RailLabel({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("truncate", railFadeClassName, className)}>{children}</span>;
}
