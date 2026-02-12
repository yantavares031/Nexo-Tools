"use client";

import { Building2 } from "lucide-react";
import type { DashboardUnidade } from "@/types/globals";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function DashboardUnidadesTable({ data }: { data: DashboardUnidade[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-slate-500">
        Nenhuma unidade com demandas.
      </p>
    );
  }

  const totalFaturado = data.reduce((s, d) => s + d.faturado, 0);
  const totalComprometido = data.reduce((s, d) => s + d.comprometido, 0);
  const totalGeral = totalFaturado + totalComprometido;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-slate-800">
        Un. Responsável — Total Faturado / Comprometido (Top 10)
      </h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-10 px-4 py-2 text-left text-xs font-semibold text-slate-800">
                #
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Un. Responsável
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Faturado
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Comprometido
              </th>
              <th className="bg-blue-50 px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.unResponsavel}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  {index + 1}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Building2 className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {item.unResponsavel}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-left text-slate-700">
                  {formatCurrency(item.faturado)}
                </td>
                <td className="px-4 py-2 text-left text-slate-700">
                  {formatCurrency(item.comprometido)}
                </td>
                <td className="bg-blue-50/50 px-4 py-2 text-left text-sm font-semibold text-slate-800">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-100">
              <td className="px-4 py-3 text-left text-xs font-bold text-slate-800">
                TOTAL
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                {formatCurrency(totalFaturado)}
              </td>
              <td className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                {formatCurrency(totalComprometido)}
              </td>
              <td className="bg-blue-100 px-4 py-3 text-left text-sm font-bold text-slate-800">
                {formatCurrency(totalGeral)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
