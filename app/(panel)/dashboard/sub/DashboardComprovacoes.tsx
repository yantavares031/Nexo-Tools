import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { integerFormat } from "@/lib/format";
import type { DemandasComprovacoesResult } from "@/lib/use-cases/get-demandas-comprovacoes-agencia.use-case";
import { DashboardCard } from "./DashboardCard";

export function DashboardComprovacoes({ data }: { data: DemandasComprovacoesResult }) {
  const items = [
    {
      label: "Comprovadas",
      value: data.totalComprovadas,
      description: `${data.totalComprovadas === 1 ? "demanda" : "demandas"} com comprovações anexadas`,
      icon: <CheckCircle2 aria-hidden />,
      tone: "bg-lime-100 text-lime-700",
    },
    {
      label: "Não comprovadas",
      value: data.totalNaoComprovadas,
      description: `${data.totalNaoComprovadas === 1 ? "demanda" : "demandas"} sem comprovações`,
      icon: <XCircle aria-hidden />,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <DashboardCard
      icon={<FileCheck2 aria-hidden />}
      title="Relatório de comprovações"
      description="Demandas da sua agência com e sem comprovações anexadas."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-md p-1.5 [&_svg]:size-3.5 ${item.tone}`}>{item.icon}</span>
              <h3 className="text-[13px] font-medium text-neutral-700">{item.label}</h3>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-neutral-950">
              {integerFormat.format(item.value)}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
