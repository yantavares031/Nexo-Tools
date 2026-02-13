"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { SearchableSelect } from "@/components/SearchableSelect";
import { AdicionarDemandaModal } from "@/modals/AdicionarDemandaModal";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
};

interface DemandasFiltersProps {
  options: DemandaFilterOptions;
  /** Oculta o filtro de agência (ex.: usuário agency já vê só as demandas dele). */
  hideAgencyFilter?: boolean;
  /** Role do usuário - agências não podem criar demandas */
  userRole?: "admin" | "operator" | "agency";
}

export function DemandasFilters({ options, hideAgencyFilter, userRole = "operator" }: DemandasFiltersProps) {
  const canCreateDemanda = userRole !== "agency";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitante, setSolicitante] = useState("");
  const [unResponsavel, setUnResponsavel] = useState("");
  const [status, setStatus] = useState("");
  const [comprovacao, setComprovacao] = useState("");

  const q = searchParams.get("q") ?? "";
  const mes = searchParams.get("mes") ?? "";
  const agencia = searchParams.get("agencia") ?? "";

  useEffect(() => {
    setSolicitante(searchParams.get("solicitante") ?? "");
    setUnResponsavel(searchParams.get("unResponsavel") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setComprovacao(searchParams.get("comprovacao") ?? "");
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();

    const qVal = (formData.get("q") as string)?.trim();
    if (qVal) params.set("q", qVal);

    if (solicitante) params.set("solicitante", solicitante);
    if (unResponsavel) params.set("unResponsavel", unResponsavel);
    if (status) params.set("status", status);
    if (comprovacao === "comprovado" || comprovacao === "nao_comprovado") params.set("comprovacao", comprovacao);

    if (!hideAgencyFilter) {
      const ag = formData.get("agencia") as string;
      if (ag) params.set("agencia", ag);
    }

    const mesVal = (formData.get("mes") as string)?.trim();
    if (mesVal) params.set("mes", mesVal);

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
    q || solicitante || unResponsavel || status || mes || comprovacao || (!hideAgencyFilter && !!agencia);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-800">Demandas</h1>
            <div className="flex items-center gap-2">
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
              {canCreateDemanda && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                  aria-label="Adicionar demanda"
                >
                  <Plus className="size-4" />
                  Adicionar
                </button>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-end gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
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
          <div className="min-w-[200px] max-w-[220px] shrink-0" aria-label="Filtrar por comprovação">
            <SearchableSelect
              options={[
                { id: "comprovado", label: "Com comprovação" },
                { id: "nao_comprovado", label: "Sem comprovação" },
              ]}
              value={comprovacao}
              onChange={setComprovacao}
              placeholder="Comprovação"
              className="min-w-[200px] max-w-[220px]"
            />
          </div>

          <div className="flex w-full flex-wrap gap-2 *:shrink-0 sm:w-auto">
            <div className="min-w-[180px]" aria-label="Filtrar por solicitante">
              <input type="hidden" name="solicitante" value={solicitante} />
              <SearchableSelect
                options={options.solicitantes.map((s) => ({ id: s, label: s }))}
                value={solicitante}
                onChange={setSolicitante}
                placeholder="Solicitante"
                className="min-w-[180px]"
              />
            </div>
            <div className="min-w-[180px]" aria-label="Filtrar por unidade responsável">
              <input type="hidden" name="unResponsavel" value={unResponsavel} />
              <SearchableSelect
                options={options.unResponsaveis.map((u) => ({ id: u, label: u }))}
                value={unResponsavel}
                onChange={setUnResponsavel}
                placeholder="Un. Responsável"
                className="min-w-[180px]"
              />
            </div>

            <div className="min-w-[160px]" aria-label="Filtrar por status">
              <SearchableSelect
                options={options.statuses.map((s) => ({
                  id: s,
                  label: STATUS_LABELS[s] ?? s,
                }))}
                value={status}
                onChange={setStatus}
                placeholder="Status"
                className="min-w-[160px]"
              />
            </div>

            <input
              type="month"
              name="mes"
              defaultValue={mes || undefined}
              placeholder="Mês / Ano"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              aria-label="Filtrar por mês/ano"
              title="Mês / Ano"
            />

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
