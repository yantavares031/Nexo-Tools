"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { DashboardAgencia } from "@/types/globals";

const COLORS = [
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardChartFaturadoDonut({ data }: { data: DashboardAgencia[] }) {
  const chartData = data
    .filter((d) => d.faturado > 0)
    .map((item, i) => ({
      name: item.agencia.nomeFantasia,
      value: item.faturado,
      color: COLORS[i % COLORS.length],
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold text-slate-800">
        Distribuição do faturado por agência
      </h3>
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
              formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value, entry) => {
                const item = chartData.find((d) => d.name === value);
                const total = chartData.reduce((s, d) => s + d.value, 0);
                const pct = item ? ((item.value / total) * 100).toFixed(1) : "0";
                return `${value} (${pct}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
