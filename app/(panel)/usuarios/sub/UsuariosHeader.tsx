"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdicionarUsuarioModal } from "@/modals/AdicionarUsuarioModal";
import type { Agencia } from "@/types/globals";

interface UsuariosHeaderProps {
  agencias: Agencia[];
}

export function UsuariosHeader({ agencias }: UsuariosHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalKey, setAddModalKey] = useState(0);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        Novo usuário
      </Button>

      <AdicionarUsuarioModal
        key={addModalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreatedSuccess={() => setAddModalKey((k) => k + 1)}
        agencias={agencias}
      />
    </>
  );
}
