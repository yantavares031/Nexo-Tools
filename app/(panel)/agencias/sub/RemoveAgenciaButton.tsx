"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeAgenciaAction } from "@/app/actions/agencia";
import { useConfirm } from "@/components/confirm-provider";
import { IconButton } from "@/components/ui/icon-button";

export function RemoveAgenciaButton({ id, nome }: { id: string; nome: string }) {
  const [isPending, startTransition] = useTransition();
  const { confirm } = useConfirm();

  async function handleRemove() {
    const ok = await confirm({
      title: "Remover agência",
      message: `Deseja realmente remover a agência "${nome}"?`,
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(() => {
      removeAgenciaAction(id);
    });
  }

  return (
    <IconButton
      aria-label="Remover agência"
      variant="danger"
      onClick={handleRemove}
      disabled={isPending}
      className="relative z-10"
    >
      <Trash2 />
    </IconButton>
  );
}
