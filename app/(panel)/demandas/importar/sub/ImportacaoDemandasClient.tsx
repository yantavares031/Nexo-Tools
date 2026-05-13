"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { getDeskfyTaskImportByCodeAction } from "@/app/actions/deskfy-task-details";
import { ImportacaoDemandasTable } from "./ImportacaoDemandasTable";
import { ImportarDemandaModal } from "@/modals/ImportarDemandaModal";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import type { DeskfyTaskDetailsResponse } from "@/types/globals";

interface ImportacaoDemandasClientProps {
  items: DemandaImportadaPreview[];
  options: DemandaFilterOptions;
}

export function ImportacaoDemandasClient({ items, options }: ImportacaoDemandasClientProps) {
  const [selectedItem, setSelectedItem] = useState<DemandaImportadaPreview | null>(null);
  const [selectedDeskfyDetails, setSelectedDeskfyDetails] = useState<DeskfyTaskDetailsResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [codigoBusca, setCodigoBusca] = useState("");
  const [isLookupPending, startLookupTransition] = useTransition();

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
    setSelectedDeskfyDetails(null);
    setSelectedItem(item);
    setModalOpen(true);
  }

  function handleImportByCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startLookupTransition(async () => {
      const result = await getDeskfyTaskImportByCodeAction(codigoBusca);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const data = result.data;
      if (!data) {
        toast.error("Nao foi possivel carregar a solicitacao da Deskfy.");
        return;
      }

      setSelectedDeskfyDetails(data.details);
      setSelectedItem(data.previewItem);
      setModalOpen(true);
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-800">Importar por codigo especifico</h2>
              <p className="text-sm text-slate-500">
                Informe o SEB-ID da solicitacao para buscar diretamente na Deskfy, por exemplo
                {" "}
                <span className="font-medium text-slate-700">SEB-300114</span> ou{" "}
                <span className="font-medium text-slate-700">300114</span>.
              </p>
            </div>

            <form onSubmit={handleImportByCodeSubmit} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="text"
                  value={codigoBusca}
                  onChange={(e) => setCodigoBusca(e.target.value)}
                  placeholder="SEB-300114"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                  aria-label="Buscar solicitacao Deskfy por codigo"
                />
              </div>
              <button
                type="submit"
                disabled={isLookupPending}
                className="inline-flex min-w-[160px] items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLookupPending ? "Buscando..." : "Buscar na Deskfy"}
              </button>
            </form>
          </div>
        </div>

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
          setSelectedDeskfyDetails(null);
        }}
        options={options}
        initialData={selectedItem}
        initialDeskfyDetails={selectedDeskfyDetails}
      />
    </>
  );
}
