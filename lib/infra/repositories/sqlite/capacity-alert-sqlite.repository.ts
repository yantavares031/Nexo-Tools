import { randomUUID } from "crypto";
import type { CapacityAlertConfig, CapacityAlertSent } from "@/types/globals";
import type {
  CapacityAlertConfigSaveInput,
  CapacityAlertSentInput,
  ICapacityAlertRepository,
} from "@/lib/domain/capacity-alert.repository";
import { getDb } from "@/DB/db";
import {
  CAPACITY_ALERT_CONFIG_ROW_ID,
  rowToCapacityAlertConfig,
  rowToCapacityAlertSent,
} from "../capacity-alert-row";

export class CapacityAlertSqliteRepository implements ICapacityAlertRepository {
  async getConfig(): Promise<CapacityAlertConfig | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM capacity_alert_config WHERE id = ?")
      .get(CAPACITY_ALERT_CONFIG_ROW_ID) as Record<string, unknown> | undefined;
    return row ? rowToCapacityAlertConfig(row) : null;
  }

  async saveConfig(input: CapacityAlertConfigSaveInput): Promise<CapacityAlertConfig> {
    const db = getDb();
    db.prepare(
      `INSERT INTO capacity_alert_config (id, enabled, thresholds, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         enabled = excluded.enabled,
         thresholds = excluded.thresholds,
         updated_at = excluded.updated_at`
    ).run(
      CAPACITY_ALERT_CONFIG_ROW_ID,
      input.enabled ? 1 : 0,
      JSON.stringify(input.thresholds),
      new Date().toISOString()
    );
    const saved = await this.getConfig();
    if (!saved) throw new Error("Falha ao persistir configuração de alertas de capacidade.");
    return saved;
  }

  async listSent(year: number): Promise<CapacityAlertSent[]> {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT s.*, a.nomeFantasia AS agencia_nome
         FROM capacity_alert_sent s
         LEFT JOIN agencias a ON a.id = s.agencia_id
         WHERE s.year = ?
         ORDER BY s.sent_at DESC`
      )
      .all(year) as Record<string, unknown>[];
    return rows.map(rowToCapacityAlertSent);
  }

  async registerSent(input: CapacityAlertSentInput): Promise<void> {
    const db = getDb();
    db.prepare(
      `INSERT INTO capacity_alert_sent (id, agencia_id, year, threshold, percentual, sent_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (agencia_id, year, threshold) DO NOTHING`
    ).run(randomUUID(), input.agenciaId, input.year, input.threshold, input.percentual, new Date().toISOString());
  }
}
