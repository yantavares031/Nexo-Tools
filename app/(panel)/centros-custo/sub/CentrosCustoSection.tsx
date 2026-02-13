"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { CentrosCustoTable } from "./CentrosCustoTable";
import type { CentroCusto } from "@/types/globals";

interface CentrosCustoSectionProps {
  centrosCusto: CentroCusto[];
}

export function CentrosCustoSection({ centrosCusto }: CentrosCustoSectionProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return centrosCusto;
    return centrosCusto.filter((cc) => cc.nome.toLowerCase().includes(term));
  }, [centrosCusto, search]);

  const emptyMessage =
    filtered.length === 0 && search.trim()
      ? "Nenhum centro de custo encontrado para a busca."
      : undefined;

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          aria-label="Buscar centros de custo"
        />
      </div>

      <CentrosCustoTable
        centrosCusto={filtered}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
