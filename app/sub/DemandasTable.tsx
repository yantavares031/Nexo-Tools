"use client";

import { useState } from "react";
import { formatMonthYearDisplay } from "@/lib/month-year";
import type { Demanda } from "@/types/globals";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { VerDetalhesDemandaModal } from "@/modals/VerDetalhesDemandaModal";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
  entregue: "Entregue",
};

const STATUS_COLORS: Record<string, string> = {
  faturado: "bg-emerald-100 text-emerald-800",
  comprometido: "bg-blue-100 text-blue-800",
  entregue: "bg-slate-100 text-slate-800",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}

interface DemandasTableProps {
  demandas: Demanda[];
  options: DemandaFilterOptions;
  readOnly?: boolean;
  userRole?: "admin" | "operator" | "agency";
}

export function DemandasTable({
  demandas,
  options,
  readOnly = false,
  userRole = "operator",
}: DemandasTableProps) {
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleRowClick(d: Demanda) {
    setSelectedDemanda(d);
    setModalOpen(true);
  }

  if (demandas.length === 0) {
    return (
      <p className="py-12 text-center text-slate-500">
        Nenhuma demanda encontrada.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1200px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-[280px] px-4 py-3 font-semibold text-slate-600">Demanda</th>
              <th className="px-4 py-3 font-semibold text-slate-600">OC/PI</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Solicitante</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Un. Responsável</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Agência</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Valor</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Mês</th>
            </tr>
          </thead>
          <tbody>
            {demandas.map((d) => (
              <tr
                key={d.id}
                onClick={() => handleRowClick(d)}
                className="cursor-pointer border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(d);
                  }
                }}
              >
                <td className="px-4 py-3 text-slate-800">
                  <span className="block truncate" title={d.demanda}>
                    {d.demanda}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">{d.ocPi || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{d.solicitante}</td>
                <td className="px-4 py-3 text-slate-600">{d.unResponsavel}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{d.agencia ?? "—"}</td>
                <td className="px-4 py-3 font-medium tabular-nums text-slate-800">
                  {formatCurrency(d.valor)}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatMonthYearDisplay(d.mes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <VerDetalhesDemandaModal
        demanda={selectedDemanda}
        options={options}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDemanda(null);
        }}
        readOnly={readOnly}
        userRole={userRole}
      />
    </>
  );
}
