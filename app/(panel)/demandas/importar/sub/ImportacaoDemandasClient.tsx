"use client";

import { useState, useMemo } from "react";
import { ImportacaoDemandasTable } from "./ImportacaoDemandasTable";
import { ImportarDemandaModal } from "@/modals/ImportarDemandaModal";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { Search } from "lucide-react";

interface ImportacaoDemandasClientProps {
  items: DemandaImportadaPreview[];
  options: DemandaFilterOptions;
}

export function ImportacaoDemandasClient({ items, options }: ImportacaoDemandasClientProps) {
  const [selectedItem, setSelectedItem] = useState<DemandaImportadaPreview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.demanda.toLowerCase().includes(term) ||
        item.codigo.toLowerCase().includes(term)
    );
  }, [items, search]);

  function handleRowClick(item: DemandaImportadaPreview) {
    setSelectedItem(item);
    setModalOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            placeholder="Buscar por descrição ou código"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
            aria-label="Buscar por descrição ou código"
          />
        </div>
        <ImportacaoDemandasTable items={filteredItems} onRowClick={handleRowClick} />
      </div>
      <ImportarDemandaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        options={options}
        initialData={selectedItem}
      />
    </>
  );
}
