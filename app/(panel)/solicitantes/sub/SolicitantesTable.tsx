"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { removeSolicitanteAction } from "@/app/actions/solicitante";
import { useConfirm } from "@/components/confirm-provider";
import { IconButton } from "@/components/ui/icon-button";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EditarSolicitanteModal } from "@/modals/EditarSolicitanteModal";
import type { Solicitante } from "@/types/globals";

export function SolicitantesTable({
  solicitantes,
  emptyMessage,
  unidades,
}: {
  solicitantes: Solicitante[];
  emptyMessage?: string;
  unidades: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingSolicitante, setEditingSolicitante] = useState<Solicitante | null>(null);
  const { confirm } = useConfirm();

  async function handleRemove(id: string) {
    const ok = await confirm({
      title: "Remover solicitante",
      message: "Deseja realmente remover este solicitante?",
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(() => {
      removeSolicitanteAction(id);
    });
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nome</TableHeaderCell>
            <TableHeaderCell>Un. responsável</TableHeaderCell>
            <TableHeaderCell className="w-24">
              <span className="sr-only">Ações</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {solicitantes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-neutral-500">
                {emptyMessage ?? "Nenhum solicitante cadastrado."}
              </TableCell>
            </TableRow>
          ) : (
            solicitantes.map((solicitante) => (
              <TableRow key={solicitante.id} className="transition-colors hover:bg-sky-50/60">
                <TableCell className="max-w-72 truncate font-medium text-neutral-950" title={solicitante.nome}>
                  {solicitante.nome}
                </TableCell>
                <TableCell>{solicitante.unResponsavel || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <IconButton
                      aria-label="Editar solicitante"
                      onClick={() => setEditingSolicitante(solicitante)}
                      disabled={isPending}
                    >
                      <Pencil />
                    </IconButton>
                    <IconButton
                      aria-label="Remover solicitante"
                      variant="danger"
                      onClick={() => handleRemove(solicitante.id)}
                      disabled={isPending}
                    >
                      <Trash2 />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EditarSolicitanteModal
        open={!!editingSolicitante}
        onClose={() => setEditingSolicitante(null)}
        solicitante={editingSolicitante}
        unidades={unidades}
      />
    </>
  );
}
