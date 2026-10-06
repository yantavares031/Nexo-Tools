"use client";

import { Gauge } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DashboardAgencia } from "@/types/globals";
import { DashboardCard, DashboardEmpty } from "./DashboardCard";
import { CHART_COLORS, chartTick, chartTooltipStyle } from "./chart-theme";

const getBarColor = (percentual: number) => {
  if (percentual >= 90) return CHART_COLORS.red;
  if (percentual >= 70) return CHART_COLORS.amber;
  return CHART_COLORS.blue;
};

export function DashboardChartUsoPercentual({ data }: { data: DashboardAgencia[] }) {
  const chartData = data.map((item) => ({
    name: item.agencia.nomeFantasia,
    percentual: Math.min(100, item.percentual),
    percentualRaw: item.percentual,
  }));

  return (
    <DashboardCard
      icon={<Gauge aria-hidden />}
      iconTone="amber"
      title="Uso do orçamento anual"
      description="Percentual da capacidade anual já faturado. Acima de 70% em âmbar e de 90% em vermelho."
    >
      {chartData.length === 0 ? (
        <DashboardEmpty className="h-72">Sem dados para exibir.</DashboardEmpty>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                tick={chartTick}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={chartTick}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <Tooltip
                formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, "Uso"]}
                contentStyle={chartTooltipStyle}
                cursor={{ fill: "#f5f5f5" }}
              />
              <Bar dataKey="percentual" name="Uso" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.percentualRaw)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
