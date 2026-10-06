"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { DashboardAgencia } from "@/types/globals";
import { DashboardCard, DashboardEmpty } from "./DashboardCard";
import { CHART_SERIES, chartLegendStyle, chartTooltipStyle, compactCurrencyFormat } from "./chart-theme";

export function DashboardChartFaturadoDonut({ data }: { data: DashboardAgencia[] }) {
  const chartData = data
    .filter((d) => d.faturado > 0)
    .map((item, i) => ({
      name: item.agencia.nomeFantasia,
      value: item.faturado,
      color: CHART_SERIES[i % CHART_SERIES.length],
    }));

  return (
    <DashboardCard
      icon={<PieChartIcon aria-hidden />}
      title="Distribuição do faturado"
      description="Participação de cada agência no total faturado."
    >
      {chartData.length === 0 ? (
        <DashboardEmpty className="h-72">Sem dados para exibir.</DashboardEmpty>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => compactCurrencyFormat.format(value ?? 0)}
                contentStyle={chartTooltipStyle}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={chartLegendStyle}
                formatter={(value) => {
                  const item = chartData.find((d) => d.name === value);
                  const total = chartData.reduce((s, d) => s + d.value, 0);
                  const pct = item ? ((item.value / total) * 100).toFixed(1) : "0";
                  return `${value} (${pct}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
