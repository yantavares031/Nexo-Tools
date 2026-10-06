"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { removeCentroCustoAction } from "@/app/actions/centro-custo";
import { useConfirm } from "@/components/confirm-provider";
import { IconButton } from "@/components/ui/icon-button";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { AdicionarCentroCustoModal } from "@/modals/AdicionarCentroCustoModal";
import type { CentroCusto } from "@/types/globals";

export function CentrosCustoTable({
  centrosCusto,
  emptyMessage,
}: {
  centrosCusto: CentroCusto[];
  emptyMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { confirm } = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleRemove(id: string, nome: string) {
    const ok = await confirm({
      title: "Remover centro de custo",
      message: `Deseja realmente remover o centro de custo "${nome}"?`,
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(() => {
      removeCentroCustoAction(id);
    });
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nome</TableHeaderCell>
            <TableHeaderCell className="w-40">Criado em</TableHeaderCell>
            <TableHeaderCell className="w-24">
              <span className="sr-only">Ações</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {centrosCusto.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-neutral-500">
                {emptyMessage ?? "Nenhum centro de custo cadastrado."}
              </TableCell>
            </TableRow>
          ) : (
            centrosCusto.map((cc) => (
              <TableRow key={cc.id} className="transition-colors hover:bg-sky-50/60">
                <TableCell className="max-w-96 truncate font-medium text-neutral-950" title={cc.nome}>
                  {cc.nome}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatDate(cc.createdAt ? new Date(cc.createdAt) : null)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <IconButton
                      aria-label="Editar centro de custo"
                      onClick={() => setEditingId(cc.id)}
                      disabled={isPending}
                    >
                      <Pencil />
                    </IconButton>
                    <IconButton
                      aria-label="Remover centro de custo"
                      variant="danger"
                      onClick={() => handleRemove(cc.id, cc.nome)}
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

      {editingId && (
        <AdicionarCentroCustoModal
          open={!!editingId}
          onClose={() => setEditingId(null)}
          centroCustoId={editingId}
        />
      )}
    </>
  );
}
