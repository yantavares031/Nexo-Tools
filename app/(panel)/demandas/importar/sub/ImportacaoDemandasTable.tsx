"use client";

import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";

interface ImportacaoDemandasTableProps {
  items: DemandaImportadaPreview[];
  onRowClick?: (item: DemandaImportadaPreview) => void;
}

export function ImportacaoDemandasTable({ items, onRowClick }: ImportacaoDemandasTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-left text-sm text-slate-500">
        Nenhuma demanda carregada para importacao.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-[280px] px-4 py-3 text-left font-semibold text-slate-600">Demanda</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Solicitante</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Board</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Coluna atual</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Valor</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Mes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-slate-100 ${onRowClick ? "cursor-pointer transition-colors duration-150 hover:bg-slate-50" : ""}`}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(item);
                      }
                    }
                  : undefined
              }
            >
              <td className="px-4 py-3 text-left text-slate-800">{item.demanda}</td>
              <td className="px-4 py-3 text-left text-slate-600">{item.solicitante}</td>
              <td className="px-4 py-3 text-left text-slate-600">{item.status}</td>
              <td className="px-4 py-3 text-left text-slate-600">{item.board}</td>
              <td className="px-4 py-3 text-left text-slate-600">{item.colunaAtual}</td>
              <td className="px-4 py-3 text-left font-medium text-slate-800">{item.valor}</td>
              <td className="px-4 py-3 text-left text-slate-600">{item.mes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
