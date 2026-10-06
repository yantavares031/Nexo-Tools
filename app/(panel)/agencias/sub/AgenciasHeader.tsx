"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdicionarAgenciaModal } from "@/modals/AdicionarAgenciaModal";

interface AgenciasHeaderProps {
  boards?: { id: string; nome: string }[];
}

export function AgenciasHeader({ boards = [] }: AgenciasHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        Nova agência
      </Button>

      <AdicionarAgenciaModal open={modalOpen} onClose={() => setModalOpen(false)} boards={boards} />
    </>
  );
}
