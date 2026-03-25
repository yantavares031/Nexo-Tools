"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SolicitantesTable } from "./SolicitantesTable";
import type { Solicitante } from "@/types/globals";

interface SolicitantesSectionProps {
  solicitantes: Solicitante[];
  unidades: string[];
  baseParams: { q?: string };
}

export function SolicitantesSection({
  solicitantes,
  unidades,
  baseParams,
}: SolicitantesSectionProps) {
  const router = useRouter();
  const currentQ = baseParams.q ?? "";

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement).value.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/solicitantes${params.toString() ? `?${params}` : ""}`);
  }

  const emptyMessage =
    solicitantes.length === 0 && currentQ
      ? "Nenhum solicitante encontrado para a busca."
      : undefined;

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSearchSubmit}
        className="relative w-full sm:w-64"
        role="search"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={currentQ}
          placeholder="Buscar por nome ou unidade..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          aria-label="Buscar solicitantes"
        />
      </form>

      <SolicitantesTable
        solicitantes={solicitantes}
        emptyMessage={emptyMessage}
        unidades={unidades}
      />
    </div>
  );
}
