"use client";

import { Megaphone } from "lucide-react";
import type { DashboardAgencia } from "@/types/globals";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function DashboardAgencias({ data }: { data: DashboardAgencia[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-slate-500">
        Nenhuma agência cadastrada.
      </p>
    );
  }

  const totalFaturado = data.reduce((s, d) => s + d.faturado, 0);
  const totalCapacidade = data.reduce((s, d) => s + d.agencia.orcamentoAnual, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Agência
              </th>
              <th className="bg-blue-50 px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Faturado
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Capacidade anual
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-800">
                Uso
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.agencia.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Megaphone className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {item.agencia.nomeFantasia}
                    </span>
                  </div>
                </td>
                <td className="bg-blue-50/50 px-4 py-2 text-left text-slate-700">
                  {formatCurrency(item.faturado)}
                </td>
                <td className="px-4 py-2 text-left text-slate-700">
                  {formatCurrency(item.agencia.orcamentoAnual)}
                </td>
                <td className="px-4 py-2 text-left">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${Math.min(100, item.percentual)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {item.percentual.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-100">
              <td className="px-4 py-3 text-left text-xs font-bold text-slate-800">
                TOTAL
              </td>
              <td className="bg-blue-100 px-4 py-3 text-left text-sm font-bold text-slate-800">
                {formatCurrency(totalFaturado)}
              </td>
              <td className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                {formatCurrency(totalCapacidade)}
              </td>
              <td className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
