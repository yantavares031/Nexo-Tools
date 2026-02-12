"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DashboardAgencia } from "@/types/globals";

const getBarColor = (percentual: number) => {
  if (percentual >= 90) return "#ef4444"; // red - próximo do limite
  if (percentual >= 70) return "#f59e0b"; // amber - atenção
  return "#3b82f6"; // blue - ok
};

export function DashboardChartUsoPercentual({ data }: { data: DashboardAgencia[] }) {
  const chartData = data.map((item) => ({
    name: item.agencia.nomeFantasia,
    percentual: Math.min(100, item.percentual),
    percentualRaw: item.percentual,
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
        Uso do orçamento anual (%)
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip
              formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, "Uso"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Bar dataKey="percentual" name="Uso" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentualRaw)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
