import type { SmtpConfig } from "@/types/globals";
import type { ISmtpConfigRepository, SmtpConfigPersistInput } from "@/lib/domain/smtp-config.repository";
import { getPool } from "@/lib/infra/db-pg";

const ROW_ID = "default";

function rowToConfig(row: Record<string, unknown>): SmtpConfig {
  return {
    id: String(row.id),
    smtpHost: String(row.smtp_host ?? "smtp.gmail.com"),
    smtpPort: Number(row.smtp_port ?? 587),
    smtpUser: String(row.smtp_user ?? ""),
    smtpPassword: String(row.smtp_password ?? ""),
    enabled: Number(row.enabled) === 1,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export class SmtpConfigPostgresRepository implements ISmtpConfigRepository {
  async get(): Promise<SmtpConfig | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM smtp_config WHERE id = $1", [ROW_ID]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async save(input: SmtpConfigPersistInput): Promise<SmtpConfig> {
    const pool = getPool();
    const now = new Date().toISOString();
    const host = input.smtpHost.trim() || "smtp.gmail.com";
    const user = input.smtpUser.trim();

    const existing = await this.get();
    if (existing) {
      await pool.query(
        `UPDATE smtp_config SET smtp_host = $1, smtp_port = $2, smtp_user = $3, smtp_password = $4, enabled = $5, updated_at = $6 WHERE id = $7`,
        [
          host,
          input.smtpPort,
          user,
          input.smtpPassword,
          input.enabled ? 1 : 0,
          now,
          ROW_ID,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO smtp_config (id, smtp_host, smtp_port, smtp_user, smtp_password, enabled, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          ROW_ID,
          host,
          input.smtpPort,
          user,
          input.smtpPassword,
          input.enabled ? 1 : 0,
          now,
        ]
      );
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração SMTP.");
    return saved;
  }
}
