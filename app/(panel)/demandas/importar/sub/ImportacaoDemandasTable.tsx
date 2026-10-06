"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";

interface ImportacaoDemandasTableProps {
  items: DemandaImportadaPreview[];
  onRowClick?: (item: DemandaImportadaPreview) => void;
  emptyMessage?: string;
}

export function ImportacaoDemandasTable({ items, onRowClick, emptyMessage }: ImportacaoDemandasTableProps) {
  return (
    <Table className="min-w-[1000px]">
      <TableHead>
        <TableRow>
          <TableHeaderCell className="w-[30%]">Demanda</TableHeaderCell>
          <TableHeaderCell>Solicitante</TableHeaderCell>
          <TableHeaderCell>Board</TableHeaderCell>
          <TableHeaderCell>Coluna atual</TableHeaderCell>
          <TableHeaderCell>Valor</TableHeaderCell>
          <TableHeaderCell>Mês</TableHeaderCell>
          <TableHeaderCell className="w-32">Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-neutral-500">
              {emptyMessage ?? "Nenhuma demanda carregada para importação."}
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={
                onRowClick
                  ? "cursor-pointer transition-colors hover:bg-sky-50/60 focus-visible:bg-sky-50/60 focus-visible:outline-none"
                  : undefined
              }
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
              <TableCell className="max-w-80" title={item.demanda}>
                <p className="truncate font-medium text-neutral-950">{item.demanda}</p>
                {item.codigo && <p className="mt-0.5 truncate text-[11px] tabular-nums text-neutral-500">{item.codigo}</p>}
              </TableCell>
              <TableCell className="max-w-48 truncate" title={item.solicitante}>
                <span className="text-link">{item.solicitante}</span>
              </TableCell>
              <TableCell className="max-w-48 truncate" title={item.board}>
                {item.board}
              </TableCell>
              <TableCell className="max-w-40 truncate" title={item.colunaAtual}>
                {item.colunaAtual}
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium tabular-nums text-neutral-800">{item.valor}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{item.mes}</TableCell>
              <TableCell>
                <Badge tone="neutral">{item.status}</Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
