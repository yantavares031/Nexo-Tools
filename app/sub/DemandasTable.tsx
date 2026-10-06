"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { currencyFormat } from "@/lib/format";
import { formatMonthYearDisplay } from "@/lib/month-year";
import { VerDetalhesDemandaModal } from "@/modals/VerDetalhesDemandaModal";
import type { Demanda } from "@/types/globals";
import { DEMANDA_STATUS_LABELS, DEMANDA_STATUS_TONES } from "./demandas-hrefs";

interface DemandasTableProps {
  demandas: Demanda[];
  options: DemandaFilterOptions;
  readOnly?: boolean;
  userRole?: "admin" | "operator" | "agency";
  emptyMessage?: string;
}

export function DemandasTable({
  demandas,
  options,
  readOnly = false,
  userRole = "operator",
  emptyMessage,
}: DemandasTableProps) {
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleRowClick(d: Demanda) {
    setSelectedDemanda(d);
    setModalOpen(true);
  }

  return (
    <>
      <ul className="divide-y divide-neutral-200/70 border-y border-neutral-200/70 md:hidden">
        {demandas.length === 0 ? (
          <li className="py-12 text-[13px] text-neutral-500">{emptyMessage ?? "Nenhuma demanda cadastrada."}</li>
        ) : (
          demandas.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => handleRowClick(d)}
                aria-label={`Ver detalhes da demanda ${d.demanda}`}
                className="flex w-full flex-col gap-1.5 py-3.5 text-left transition-colors active:bg-sky-50/60"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="line-clamp-2 text-[13px] font-medium text-neutral-950">{d.demanda}</span>
                  <Badge tone={DEMANDA_STATUS_TONES[d.status] ?? "neutral"}>
                    {DEMANDA_STATUS_LABELS[d.status] ?? d.status}
                  </Badge>
                </span>
                <span className="truncate text-xs text-neutral-500">
                  {[d.solicitante, d.agencia].filter(Boolean).join(" · ")}
                </span>
                <span className="flex items-center justify-between gap-3 text-xs text-neutral-500">
                  <span className="font-medium tabular-nums text-neutral-800">{currencyFormat.format(d.valor)}</span>
                  <span className="truncate tabular-nums">
                    {[d.ocPi, formatMonthYearDisplay(d.mes)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="max-md:hidden">
        <Table className="min-w-[1100px]">
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-[28%]">Demanda</TableHeaderCell>
              <TableHeaderCell>OC/PI</TableHeaderCell>
              <TableHeaderCell>Solicitante</TableHeaderCell>
              <TableHeaderCell>Un. responsável</TableHeaderCell>
              <TableHeaderCell>Agência</TableHeaderCell>
              <TableHeaderCell>Valor</TableHeaderCell>
              <TableHeaderCell>Mês</TableHeaderCell>
              <TableHeaderCell className="w-32">Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {demandas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-neutral-500">
                  {emptyMessage ?? "Nenhuma demanda cadastrada."}
                </TableCell>
              </TableRow>
            ) : (
              demandas.map((d) => (
                <TableRow
                  key={d.id}
                  onClick={() => handleRowClick(d)}
                  className="cursor-pointer transition-colors hover:bg-sky-50/60 focus-visible:bg-sky-50/60 focus-visible:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalhes da demanda ${d.demanda}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(d);
                    }
                  }}
                >
                  <TableCell className="max-w-80 truncate font-medium text-neutral-950" title={d.demanda}>
                    {d.demanda}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{d.ocPi || "—"}</TableCell>
                  <TableCell className="max-w-48 truncate" title={d.solicitante}>
                    <span className="text-link">{d.solicitante}</span>
                  </TableCell>
                  <TableCell className="max-w-48 truncate" title={d.unResponsavel}>
                    {d.unResponsavel}
                  </TableCell>
                  <TableCell className="max-w-48 truncate" title={d.agencia ?? undefined}>
                    {d.agencia ? <span className="text-link">{d.agencia}</span> : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium tabular-nums text-neutral-800">
                    {currencyFormat.format(d.valor)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{formatMonthYearDisplay(d.mes)}</TableCell>
                  <TableCell>
                    <Badge tone={DEMANDA_STATUS_TONES[d.status] ?? "neutral"}>
                      {DEMANDA_STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
