import { randomUUID } from "crypto";
import type { CapacityAlertConfig, CapacityAlertSent } from "@/types/globals";
import type {
  CapacityAlertConfigSaveInput,
  CapacityAlertSentInput,
  ICapacityAlertRepository,
} from "@/lib/domain/capacity-alert.repository";
import { getPool } from "@/lib/infra/db-pg";
import {
  CAPACITY_ALERT_CONFIG_ROW_ID,
  rowToCapacityAlertConfig,
  rowToCapacityAlertSent,
} from "../capacity-alert-row";

export class CapacityAlertPostgresRepository implements ICapacityAlertRepository {
  async getConfig(): Promise<CapacityAlertConfig | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM capacity_alert_config WHERE id = $1", [
      CAPACITY_ALERT_CONFIG_ROW_ID,
    ]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToCapacityAlertConfig(row) : null;
  }

  async saveConfig(input: CapacityAlertConfigSaveInput): Promise<CapacityAlertConfig> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO capacity_alert_config (id, enabled, thresholds, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         thresholds = EXCLUDED.thresholds,
         updated_at = EXCLUDED.updated_at`,
      [
        CAPACITY_ALERT_CONFIG_ROW_ID,
        input.enabled ? 1 : 0,
        JSON.stringify(input.thresholds),
        new Date().toISOString(),
      ]
    );
    const saved = await this.getConfig();
    if (!saved) throw new Error("Falha ao persistir configuração de alertas de capacidade.");
    return saved;
  }

  async listSent(year: number): Promise<CapacityAlertSent[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT s.*, a."nomeFantasia" AS agencia_nome
       FROM capacity_alert_sent s
       LEFT JOIN agencias a ON a.id = s.agencia_id
       WHERE s.year = $1
       ORDER BY s.sent_at DESC`,
      [year]
    );
    return (result.rows as Record<string, unknown>[]).map(rowToCapacityAlertSent);
  }

  async registerSent(input: CapacityAlertSentInput): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO capacity_alert_sent (id, agencia_id, year, threshold, percentual, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (agencia_id, year, threshold) DO NOTHING`,
      [randomUUID(), input.agenciaId, input.year, input.threshold, input.percentual, new Date().toISOString()]
    );
  }
}
