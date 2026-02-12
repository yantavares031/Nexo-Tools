"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2, Megaphone } from "lucide-react";
import { removeAgenciaAction } from "@/app/actions/agencia";
import { useConfirm } from "@/lib/confirm-context";
import type { Agencia } from "@/types/globals";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function AgenciasCards({ agencias }: { agencias: Agencia[] }) {
  const [isPending, startTransition] = useTransition();
  const { confirm } = useConfirm();

  async function handleRemove(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: "Remover agência",
      message: "Deseja realmente remover esta agência?",
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(() => {
      removeAgenciaAction(id);
    });
  }

  if (agencias.length === 0) {
    return (
      <p className="py-12 text-center text-slate-500">
        Nenhuma agência cadastrada.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agencias.map((a) => (
        <Link
          key={a.id}
          href={`/agencias/${a.id}`}
          className="relative block cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
        >
          <button
            type="button"
            onClick={(e) => handleRemove(e, a.id)}
            disabled={isPending}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Remover agência"
          >
            <Trash2 className="size-4" />
          </button>

          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Megaphone className="size-5" />
            </div>
            <h3 className="pr-8 text-base font-semibold text-slate-800">
              {a.nomeFantasia}
            </h3>
          </div>
          <p className="mt-2 font-mono text-sm text-slate-600">{a.cnpj}</p>
          <p className="mt-2 text-sm text-slate-700">
            Limite orçamento anual:{" "}
            <span className="font-semibold text-emerald-600">
              {formatCurrency(a.orcamentoAnual)}
            </span>
          </p>
        </Link>
      ))}
    </div>
  );
}
