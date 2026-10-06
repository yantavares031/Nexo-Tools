import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded bg-neutral-100", className)} />;
}
