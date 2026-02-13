"use client";

import { useTransition } from "react";
import { Trash2, Pencil } from "lucide-react";
import { removeCentroCustoAction } from "@/app/actions/centro-custo";
import { useConfirm } from "@/lib/confirm-context";
import type { CentroCusto } from "@/types/globals";
import { useState } from "react";
import { AdicionarCentroCustoModal } from "@/modals/AdicionarCentroCustoModal";

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

  if (centrosCusto.length === 0) {
    return (
      <p className="py-12 text-center text-slate-500">
        {emptyMessage ?? "Nenhum centro de custo cadastrado."}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-600">Nome</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Criado em</th>
              <th className="w-20 px-2 py-3" aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {centrosCusto.map((cc) => (
              <tr
                key={cc.id}
                className="border-b border-slate-100 transition hover:bg-slate-50/50"
              >
                <td className="px-4 py-3 text-slate-800">{cc.nome}</td>
                <td className="px-4 py-3 text-slate-600">
                  {cc.createdAt
                    ? new Date(cc.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(cc.id)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                      aria-label="Editar centro de custo"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(cc.id, cc.nome)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label="Remover centro de custo"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
