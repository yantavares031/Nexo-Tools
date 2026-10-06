"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { AdicionarDemandaModal } from "@/modals/AdicionarDemandaModal";

export function DemandasHeaderActions({ options }: { options: DemandaFilterOptions }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        Nova demanda
      </Button>

      <AdicionarDemandaModal open={modalOpen} onClose={() => setModalOpen(false)} options={options} />
    </>
  );
}
