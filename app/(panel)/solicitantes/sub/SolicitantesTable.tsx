"use client";

import { useState, useTransition } from "react";
import { Trash2, Pencil } from "lucide-react";
import { removeSolicitanteAction } from "@/app/actions/solicitante";
import { useConfirm } from "@/lib/confirm-context";
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

  if (solicitantes.length === 0) {
    return (
      <p className="py-12 text-center text-slate-500">
        {emptyMessage ?? "Nenhum solicitante cadastrado."}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-800">Nome</th>
              <th className="px-4 py-3 font-semibold text-slate-800">
                Un. Responsável
              </th>
              <th className="w-20 px-2 py-3 font-semibold text-slate-800" aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {solicitantes.map((s) => (
              <tr
                key={s.id}
                className="border-b border-slate-100 transition hover:bg-slate-50/50"
              >
                <td className="px-4 py-3 text-slate-800">{s.nome}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.unResponsavel || "—"}
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingSolicitante(s)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                      aria-label="Editar solicitante"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(s.id)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label="Remover solicitante"
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

      <EditarSolicitanteModal
        open={!!editingSolicitante}
        onClose={() => setEditingSolicitante(null)}
        solicitante={editingSolicitante}
        unidades={unidades}
      />
    </>
  );
}
