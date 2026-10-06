import type { PendingReminderConfig } from "@/types/globals";
import type {
  IPendingReminderConfigRepository,
  PendingReminderConfigSaveInput,
} from "@/lib/domain/pending-reminder-config.repository";
import { getPool } from "@/lib/infra/db-pg";

const ROW_ID = "default";

function rowToConfig(row: Record<string, unknown>): PendingReminderConfig {
  return {
    enabled: Number(row.enabled) === 1,
    ordemCompraDays: Number(row.ordem_compra_days ?? 3),
    comprovacaoDays: Number(row.comprovacao_days ?? 7),
    lastRunAt: row.last_run_at ? String(row.last_run_at) : null,
    lastRunSummary: row.last_run_summary ? String(row.last_run_summary) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

export class PendingReminderConfigPostgresRepository implements IPendingReminderConfigRepository {
  async get(): Promise<PendingReminderConfig | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM pending_reminder_config WHERE id = $1", [ROW_ID]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async save(input: PendingReminderConfigSaveInput): Promise<PendingReminderConfig> {
    const pool = getPool();
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO pending_reminder_config (id, enabled, ordem_compra_days, comprovacao_days, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         ordem_compra_days = EXCLUDED.ordem_compra_days,
         comprovacao_days = EXCLUDED.comprovacao_days,
         updated_at = EXCLUDED.updated_at`,
      [ROW_ID, input.enabled ? 1 : 0, input.ordemCompraDays, input.comprovacaoDays, now]
    );
    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração de lembretes.");
    return saved;
  }

  async registerRun(summary: string): Promise<void> {
    const pool = getPool();
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO pending_reminder_config (id, last_run_at, last_run_summary)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         last_run_at = EXCLUDED.last_run_at,
         last_run_summary = EXCLUDED.last_run_summary`,
      [ROW_ID, now, summary]
    );
  }
}
