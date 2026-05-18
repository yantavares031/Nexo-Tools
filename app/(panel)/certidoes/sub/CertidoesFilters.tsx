"use client";

import Link from "next/link";

export interface CertidaoAgenciaOption {
  id: string;
  nomeFantasia: string;
}

export interface CertidoesFilterParams {
  q?: string;
  mes?: string;
  agenciaId?: string;
}

interface CertidoesFiltersProps {
  defaultQ: string;
  defaultMes: string;
  defaultAgenciaId: string;
  agencias: CertidaoAgenciaOption[];
  hideAgencyFilter?: boolean;
}

export function CertidoesFilters({
  defaultQ,
  defaultMes,
  defaultAgenciaId,
  agencias,
  hideAgencyFilter = false,
}: CertidoesFiltersProps) {
  const hasFilters = Boolean(defaultQ || defaultMes || (!hideAgencyFilter && defaultAgenciaId));

  return (
    <form
      method="GET"
      className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="min-w-[200px] flex-1">
        <label htmlFor="q" className="mb-1.5 block text-xs font-medium text-slate-600">
          Buscar pela descrição
        </label>
        <input
          id="q"
          name="q"
          defaultValue={defaultQ}
              placeholder="Ex.: RFB, FGTS, federal..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label htmlFor="mes" className="mb-1.5 block text-xs font-medium text-slate-600">
          Mês / ano
        </label>
        <input
          type="month"
          id="mes"
          name="mes"
          defaultValue={defaultMes || undefined}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          aria-label="Filtrar por mês e ano"
        />
      </div>

      {!hideAgencyFilter && (
        <div className="min-w-[180px]">
          <label htmlFor="agenciaId" className="mb-1.5 block text-xs font-medium text-slate-600">
            Agência
          </label>
          <select
            id="agenciaId"
            name="agenciaId"
            defaultValue={defaultAgenciaId}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todas</option>
            {agencias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nomeFantasia}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
      >
        Filtrar
      </button>
      {hasFilters && (
        <Link
          href="/certidoes"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Limpar
        </Link>
      )}
    </form>
  );
}
