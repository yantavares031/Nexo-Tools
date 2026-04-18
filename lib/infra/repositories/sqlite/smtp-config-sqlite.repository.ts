import type { SmtpConfig } from "@/types/globals";
import type { ISmtpConfigRepository, SmtpConfigPersistInput } from "@/lib/domain/smtp-config.repository";
import { getDb } from "@/DB/db";

const ROW_ID = "default";

function parseNotifyEmailsJson(raw: unknown): string[] {
  if (raw == null || String(raw).trim() === "") return [];
  try {
    const v = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((e): e is string => typeof e === "string" && e.trim().length > 0).map((e) => e.trim());
  } catch {
    return [];
  }
}

function rowToConfig(row: Record<string, unknown>): SmtpConfig {
  return {
    id: String(row.id),
    smtpHost: String(row.smtp_host ?? "smtp.gmail.com"),
    smtpPort: Number(row.smtp_port ?? 587),
    smtpUser: String(row.smtp_user ?? ""),
    smtpPassword: String(row.smtp_password ?? ""),
    enabled: Number(row.enabled) === 1,
    ordemCompraNotifyEmails: parseNotifyEmailsJson(row.ordem_compra_notify_emails),
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
    const notifyJson = JSON.stringify(input.ordemCompraNotifyEmails ?? []);
    if (existing) {
      db.prepare(
        `UPDATE smtp_config SET smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_password = ?, enabled = ?, ordem_compra_notify_emails = ?, updated_at = ? WHERE id = ?`
      ).run(
        host,
        input.smtpPort,
        user,
        input.smtpPassword,
        input.enabled ? 1 : 0,
        notifyJson,
        now,
        ROW_ID
      );
    } else {
      db.prepare(
        `INSERT INTO smtp_config (id, smtp_host, smtp_port, smtp_user, smtp_password, enabled, ordem_compra_notify_emails, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        ROW_ID,
        host,
        input.smtpPort,
        user,
        input.smtpPassword,
        input.enabled ? 1 : 0,
        notifyJson,
        now
      );
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração SMTP.");
    return saved;
  }
}
