export const CHART_COLORS = {
  sky: "#0ea5e9",
  blue: "#2563eb",
  lime: "#65a30d",
  amber: "#f59e0b",
  red: "#ef4444",
  neutral: "#404040",
  neutralLight: "#a3a3a3",
  grid: "#e5e5e5",
  tick: "#737373",
} as const;

export const CHART_SERIES = [
  CHART_COLORS.blue,
  CHART_COLORS.sky,
  CHART_COLORS.lime,
  CHART_COLORS.amber,
  CHART_COLORS.neutral,
  CHART_COLORS.red,
  CHART_COLORS.neutralLight,
];

export const chartTick = { fontSize: 11, fill: CHART_COLORS.tick };

export const chartTooltipStyle = {
  borderRadius: "8px",
  border: `1px solid ${CHART_COLORS.grid}`,
  fontSize: "12px",
  boxShadow: "0 10px 15px -3px rgb(23 23 23 / 0.05)",
};

export const chartLegendStyle = { fontSize: "12px", color: CHART_COLORS.tick };

export const compactCurrencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
