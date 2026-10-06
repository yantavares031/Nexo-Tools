"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdicionarCentroCustoModal } from "@/modals/AdicionarCentroCustoModal";

export function CentrosCustoHeader() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        Novo centro de custo
      </Button>

      <AdicionarCentroCustoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
