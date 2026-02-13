"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { DemandasComprovacoesResult } from "@/lib/use-cases/get-demandas-comprovacoes-agencia.use-case";

export function DashboardComprovacoes({ data }: { data: DemandasComprovacoesResult }) {
  return (
    <section>
      <h2 className="mb-4 text-base font-semibold text-slate-800">
        Relatório de Comprovações
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Card Comprovadas */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-emerald-800">Comprovadas</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{data.totalComprovadas}</p>
          <p className="text-xs text-emerald-700 mt-1">
            {data.totalComprovadas === 1 ? "demanda" : "demandas"} com comprovações anexadas
          </p>
        </div>

        {/* Card Não Comprovadas */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="size-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Não Comprovadas</h3>
          </div>
          <p className="text-2xl font-bold text-amber-900">{data.totalNaoComprovadas}</p>
          <p className="text-xs text-amber-700 mt-1">
            {data.totalNaoComprovadas === 1 ? "demanda" : "demandas"} sem comprovações
          </p>
        </div>
      </div>
    </section>
  );
}
