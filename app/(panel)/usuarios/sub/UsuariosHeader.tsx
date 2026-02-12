"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdicionarUsuarioModal } from "@/modals/AdicionarUsuarioModal";
import type { Agencia } from "@/types/globals";

interface UsuariosHeaderProps {
  agencias: Agencia[];
}

export function UsuariosHeader({ agencias }: UsuariosHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          Cadastro de usuários
        </h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          aria-label="Adicionar usuário"
        >
          <Plus className="size-4" />
          Adicionar
        </button>
      </div>

      <AdicionarUsuarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        agencias={agencias}
      />
    </>
  );
}
