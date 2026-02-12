"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { AdicionarDemandaModal } from "@/modals/AdicionarDemandaModal";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
};

interface DemandasFiltersProps {
  options: DemandaFilterOptions;
  /** Oculta o filtro de agência (ex.: usuário agency já vê só as demandas dele). */
  hideAgencyFilter?: boolean;
}

export function DemandasFilters({ options, hideAgencyFilter }: DemandasFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);

  const q = searchParams.get("q") ?? "";
  const solicitante = searchParams.get("solicitante") ?? "";
  const unResponsavel = searchParams.get("unResponsavel") ?? "";
  const status = searchParams.get("status") ?? "";
  const agencia = searchParams.get("agencia") ?? "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();

    const qVal = (formData.get("q") as string)?.trim();
    if (qVal) params.set("q", qVal);

    const sol = formData.get("solicitante") as string;
    if (sol) params.set("solicitante", sol);

    const un = formData.get("unResponsavel") as string;
    if (un) params.set("unResponsavel", un);

    const st = formData.get("status") as string;
    if (st) params.set("status", st);

    if (!hideAgencyFilter) {
      const ag = formData.get("agencia") as string;
      if (ag) params.set("agencia", ag);
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  function handleClear() {
    startTransition(() => {
      router.push("/");
    });
  }

  const hasFilters =
    q || solicitante || unResponsavel || status || (!hideAgencyFilter && !!agencia);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-800">Demandas</h1>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
              aria-label="Adicionar demanda"
            >
              <Plus className="size-4" />
              Adicionar
            </button>
          </div>

          <div className="flex min-w-0 flex-wrap items-end gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1 sm:min-w-[320px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome da demanda, OC/PI ou SEBID..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              aria-label="Buscar demandas"
            />
          </div>

          <div className="flex flex-wrap gap-2 *:shrink-0">
            <select
              name="solicitante"
              defaultValue={solicitante}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              aria-label="Filtrar por solicitante"
            >
              <option value="">Solicitante</option>
              {options.solicitantes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              name="unResponsavel"
              defaultValue={unResponsavel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              aria-label="Filtrar por unidade responsável"
            >
              <option value="">Un. Responsável</option>
              {options.unResponsaveis.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              aria-label="Filtrar por status"
            >
              <option value="">Status</option>
              {options.statuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>

            {!hideAgencyFilter && (
              <select
                name="agencia"
                defaultValue={agencia}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                aria-label="Filtrar por agência"
              >
                <option value="">Agência</option>
                {options.agencias.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              <Filter className="size-4" />
              {isPending ? "Filtrando..." : "Filtrar"}
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                aria-label="Limpar filtros"
              >
                <X className="size-4" />
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>
    </form>

    <AdicionarDemandaModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      options={options}
    />
    </>
  );
}
