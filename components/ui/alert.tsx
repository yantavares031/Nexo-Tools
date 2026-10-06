import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-neutral-200 bg-neutral-50 text-neutral-700",
} as const;

export function Alert({ tone = "info", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-field border px-3 py-2.5 text-sm", tones[tone])}
    >
      {children}
    </p>
  );
}
