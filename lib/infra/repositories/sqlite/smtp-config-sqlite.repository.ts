import type { SmtpConfig } from "@/types/globals";
import type { ISmtpConfigRepository, SmtpConfigPersistInput } from "@/lib/domain/smtp-config.repository";
import { getDb } from "@/DB/db";

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

export class SmtpConfigSqliteRepository implements ISmtpConfigRepository {
  async get(): Promise<SmtpConfig | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM smtp_config WHERE id = ?")
      .get(ROW_ID) as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async save(input: SmtpConfigPersistInput): Promise<SmtpConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const host = input.smtpHost.trim() || "smtp.gmail.com";
    const user = input.smtpUser.trim();

    const existing = await this.get();
    if (existing) {
      db.prepare(
        `UPDATE smtp_config SET smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_password = ?, enabled = ?, updated_at = ? WHERE id = ?`
      ).run(
        host,
        input.smtpPort,
        user,
        input.smtpPassword,
        input.enabled ? 1 : 0,
        now,
        ROW_ID
      );
    } else {
      db.prepare(
        `INSERT INTO smtp_config (id, smtp_host, smtp_port, smtp_user, smtp_password, enabled, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        ROW_ID,
        host,
        input.smtpPort,
        user,
        input.smtpPassword,
        input.enabled ? 1 : 0,
        now
      );
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração SMTP.");
    return saved;
  }
}
