"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { getDeskfyTaskImportByCodeAction } from "@/app/actions/deskfy-task-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { integerFormat } from "@/lib/format";
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
        toast.error("Não foi possível carregar a solicitação da Deskfy.");
        return;
      }

      setSelectedDeskfyDetails(data.details);
      setSelectedItem(data.previewItem);
      setModalOpen(true);
    });
  }

  const searchTerm = search.trim();

  return (
    <>
      <section className="flex flex-col gap-4 border-b border-neutral-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">Importar por código</h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Informe o SEB-ID da solicitação para buscar direto na Deskfy, por exemplo{" "}
            <span className="font-medium text-neutral-700">SEB-300114</span> ou{" "}
            <span className="font-medium text-neutral-700">300114</span>.
          </p>
        </div>

        <form onSubmit={handleImportByCodeSubmit} className="flex w-full max-w-lg flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={codigoBusca}
            onChange={(e) => setCodigoBusca(e.target.value)}
            placeholder="SEB-300114"
            aria-label="Buscar solicitação Deskfy por código"
            className="h-9 sm:flex-1"
          />
          <Button type="submit" loading={isLookupPending}>
            {isLookupPending ? "Buscando..." : "Buscar na Deskfy"}
          </Button>
        </form>
      </section>

      <div className="space-y-3">
        <div
          role="search"
          className="flex h-9 w-full items-center rounded-full border border-neutral-300 bg-white transition-colors focus-within:border-neutral-700 focus-within:ring-2 focus-within:ring-neutral-900/5 hover:border-neutral-400 sm:w-80"
        >
          <Search className="ml-3.5 size-4 shrink-0 text-neutral-400" aria-hidden />
          <input
            type="search"
            placeholder="Buscar por descrição ou código"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar por descrição ou código"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="mr-2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <Badge tone="dark" className="px-2.5 py-1">
            <span className="tabular-nums">{integerFormat.format(filteredItems.length)}</span>
            {filteredItems.length === 1 ? "solicitação" : "solicitações"}
          </Badge>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-0.5 pr-1 pl-2.5 text-xs text-neutral-700">
              “{searchTerm}”
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Remover filtro busca"
                className="rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>

        <ImportacaoDemandasTable
          items={filteredItems}
          onRowClick={handleRowClick}
          emptyMessage={searchTerm ? "Nenhuma solicitação encontrada para a busca." : undefined}
        />
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
