"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdicionarAgenciaModal } from "@/modals/AdicionarAgenciaModal";

interface AgenciasHeaderProps {
  boards?: { id: string; nome: string }[];
}

export function AgenciasHeader({ boards = [] }: AgenciasHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Agências</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          aria-label="Adicionar agência"
        >
          <Plus className="size-4" />
          Adicionar
        </button>
      </div>

      <AdicionarAgenciaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        boards={boards}
      />
    </>
  );
}
