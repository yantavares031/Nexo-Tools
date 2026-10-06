import type { PendingReminderConfig } from "@/types/globals";
import type {
  IPendingReminderConfigRepository,
  PendingReminderConfigSaveInput,
} from "@/lib/domain/pending-reminder-config.repository";
import { getDb } from "@/DB/db";

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

export class PendingReminderConfigSqliteRepository implements IPendingReminderConfigRepository {
  async get(): Promise<PendingReminderConfig | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM pending_reminder_config WHERE id = ?")
      .get(ROW_ID) as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async save(input: PendingReminderConfigSaveInput): Promise<PendingReminderConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO pending_reminder_config (id, enabled, ordem_compra_days, comprovacao_days, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         enabled = excluded.enabled,
         ordem_compra_days = excluded.ordem_compra_days,
         comprovacao_days = excluded.comprovacao_days,
         updated_at = excluded.updated_at`
    ).run(ROW_ID, input.enabled ? 1 : 0, input.ordemCompraDays, input.comprovacaoDays, now);
    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração de lembretes.");
    return saved;
  }

  async registerRun(summary: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO pending_reminder_config (id, last_run_at, last_run_summary)
       VALUES (?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         last_run_at = excluded.last_run_at,
         last_run_summary = excluded.last_run_summary`
    ).run(ROW_ID, now, summary);
  }
}
