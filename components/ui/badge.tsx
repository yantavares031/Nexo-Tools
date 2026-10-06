import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-neutral-100 text-neutral-600",
  success: "bg-lime-100 text-lime-700",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  muted: "bg-neutral-100 text-neutral-500",
  dark: "bg-neutral-800 text-white",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
