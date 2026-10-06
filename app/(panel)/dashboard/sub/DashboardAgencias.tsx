import { Megaphone } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { currencyFormat } from "@/lib/format";
import type { DashboardAgencia } from "@/types/globals";
import { DashboardCard, DashboardEmpty } from "./DashboardCard";

function usoTone(percentual: number): BadgeTone {
  if (percentual >= 100) return "danger";
  if (percentual >= 80) return "warning";
  return "success";
}

export function DashboardAgencias({ data }: { data: DashboardAgencia[] }) {
  const totalFaturado = data.reduce((s, d) => s + d.faturado, 0);
  const totalCapacidade = data.reduce((s, d) => s + d.agencia.orcamentoAnual, 0);

  return (
    <DashboardCard
      icon={<Megaphone aria-hidden />}
      title="Agências"
      description="Faturado no ano em relação à capacidade anual de cada agência."
    >
      {data.length === 0 ? (
        <DashboardEmpty>Nenhuma agência cadastrada.</DashboardEmpty>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Agência</TableHeaderCell>
              <TableHeaderCell>Faturado</TableHeaderCell>
              <TableHeaderCell>Capacidade anual</TableHeaderCell>
              <TableHeaderCell className="w-56">Uso</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.agencia.id} className="transition-colors hover:bg-sky-50/60">
                <TableCell
                  className="max-w-72 truncate font-medium text-neutral-950"
                  title={item.agencia.nomeFantasia}
                >
                  {item.agencia.nomeFantasia}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-neutral-800">
                  {currencyFormat.format(item.faturado)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {currencyFormat.format(item.agencia.orcamentoAnual)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-700"
                        style={{ width: `${Math.min(100, item.percentual)}%` }}
                      />
                    </div>
                    <Badge tone={usoTone(item.percentual)}>
                      <span className="tabular-nums">{item.percentual.toFixed(1)}%</span>
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-b-0">
              <TableCell className="font-semibold text-neutral-950">Total</TableCell>
              <TableCell className="whitespace-nowrap font-semibold tabular-nums text-neutral-950">
                {currencyFormat.format(totalFaturado)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-semibold tabular-nums text-neutral-950">
                {currencyFormat.format(totalCapacidade)}
              </TableCell>
              <TableCell className="text-neutral-400">—</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </DashboardCard>
  );
}
