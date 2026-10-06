"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";
import { certidoesHref, type CertidoesFilterParams } from "./hrefs";

export function CertidoesMonthFilter({ q, mes, agenciaId }: CertidoesFilterParams) {
  const router = useRouter();

  return (
    <label
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap transition-colors",
        mes
          ? "border-neutral-800 bg-neutral-800 text-white [color-scheme:dark]"
          : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
      )}
    >
      <CalendarDays className="size-3.5" aria-hidden />
      <span className="opacity-70">Mês</span>
      <input
        key={mes ?? ""}
        type="month"
        defaultValue={mes || undefined}
        aria-label="Filtrar por mês e ano"
        onChange={(e) => router.push(certidoesHref({ q, agenciaId, mes: e.target.value || undefined }))}
        className="bg-transparent font-medium outline-none"
      />
    </label>
  );
}
