"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdicionarSolicitanteModal } from "@/modals/AdicionarSolicitanteModal";

interface SolicitantesHeaderProps {
  unidades: string[];
}

export function SolicitantesHeader({ unidades }: SolicitantesHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Cadastro de solicitantes
        </h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          aria-label="Adicionar solicitante"
        >
          <Plus className="size-4" />
          Adicionar
        </button>
      </div>

      <AdicionarSolicitanteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        unidades={unidades}
      />
    </>
  );
}
