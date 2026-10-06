import { Building2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { currencyFormat } from "@/lib/format";
import type { DashboardUnidade } from "@/types/globals";
import { DashboardCard, DashboardEmpty } from "./DashboardCard";

export function DashboardUnidadesTable({ data }: { data: DashboardUnidade[] }) {
  const totalFaturado = data.reduce((s, d) => s + d.faturado, 0);
  const totalComprometido = data.reduce((s, d) => s + d.comprometido, 0);
  const totalGeral = totalFaturado + totalComprometido;

  return (
    <DashboardCard
      icon={<Building2 aria-hidden />}
      iconTone="lime"
      title="Por un. responsável"
      description="Total faturado e comprometido por unidade (top 10)."
    >
      {data.length === 0 ? (
        <DashboardEmpty>Nenhuma unidade com demandas.</DashboardEmpty>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-12">Pos.</TableHeaderCell>
              <TableHeaderCell>Un. responsável</TableHeaderCell>
              <TableHeaderCell>Faturado</TableHeaderCell>
              <TableHeaderCell>Comprometido</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.unResponsavel} className="transition-colors hover:bg-sky-50/60">
                <TableCell className="tabular-nums text-neutral-400">{index + 1}</TableCell>
                <TableCell className="max-w-72 truncate font-medium text-neutral-950" title={item.unResponsavel}>
                  {item.unResponsavel}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{currencyFormat.format(item.faturado)}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {currencyFormat.format(item.comprometido)}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium tabular-nums text-neutral-950">
                  {currencyFormat.format(item.total)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-b-0">
              <TableCell />
              <TableCell className="font-semibold text-neutral-950">Total</TableCell>
              <TableCell className="whitespace-nowrap font-semibold tabular-nums text-neutral-950">
                {currencyFormat.format(totalFaturado)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-semibold tabular-nums text-neutral-950">
                {currencyFormat.format(totalComprometido)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-semibold tabular-nums text-neutral-950">
                {currencyFormat.format(totalGeral)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </DashboardCard>
  );
}
