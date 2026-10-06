"use client";

import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DashboardAgencia } from "@/types/globals";
import { DashboardCard, DashboardEmpty } from "./DashboardCard";
import { CHART_COLORS, chartLegendStyle, chartTick, chartTooltipStyle, compactCurrencyFormat } from "./chart-theme";

export function DashboardChartFaturadoVsCapacidade({ data }: { data: DashboardAgencia[] }) {
  const chartData = data.map((item) => ({
    name: item.agencia.nomeFantasia,
    faturado: item.faturado,
    capacidade: item.agencia.orcamentoAnual,
  }));

  return (
    <DashboardCard
      icon={<BarChart3 aria-hidden />}
      title="Faturado vs capacidade anual"
      description="Valores em R$ por agência."
    >
      {chartData.length === 0 ? (
        <DashboardEmpty className="h-72">Sem dados para exibir.</DashboardEmpty>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={chartTick}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.grid }}
              />
              <YAxis
                tick={chartTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number | undefined) => compactCurrencyFormat.format(value ?? 0)}
                contentStyle={chartTooltipStyle}
                cursor={{ fill: "#f5f5f5" }}
              />
              <Legend wrapperStyle={chartLegendStyle} />
              <Bar dataKey="faturado" name="Faturado" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="capacidade"
                name="Capacidade anual"
                fill={CHART_COLORS.neutralLight}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
