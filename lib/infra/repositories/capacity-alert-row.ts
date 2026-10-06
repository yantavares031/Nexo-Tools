import type { CapacityAlertConfig, CapacityAlertSent } from "@/types/globals";

export const CAPACITY_ALERT_CONFIG_ROW_ID = "default";

function parseThresholds(raw: unknown): number[] {
  try {
    const parsed = JSON.parse(String(raw ?? "[]")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function rowToCapacityAlertConfig(row: Record<string, unknown>): CapacityAlertConfig {
  return {
    enabled: Number(row.enabled) === 1,
    thresholds: parseThresholds(row.thresholds),
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

export function rowToCapacityAlertSent(row: Record<string, unknown>): CapacityAlertSent {
  return {
    id: String(row.id),
    agenciaId: String(row.agencia_id),
    agenciaNome: row.agencia_nome ? String(row.agencia_nome) : null,
    year: Number(row.year),
    threshold: Number(row.threshold),
    percentual: Number(row.percentual),
    sentAt: String(row.sent_at),
  };
}
