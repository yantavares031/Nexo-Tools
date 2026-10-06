"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdicionarSolicitanteModal } from "@/modals/AdicionarSolicitanteModal";

interface SolicitantesHeaderProps {
  unidades: string[];
}

export function SolicitantesHeader({ unidades }: SolicitantesHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        Novo solicitante
      </Button>

      <AdicionarSolicitanteModal open={modalOpen} onClose={() => setModalOpen(false)} unidades={unidades} />
    </>
  );
}
