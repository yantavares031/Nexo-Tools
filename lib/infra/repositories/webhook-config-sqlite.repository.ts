import type { WebhookConfig, WebhookConfigInput, WebhookContact } from "@/types/globals";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";
import { getDb } from "@/DB/db";

const ROW_ID = "default";

function parseEvents(eventsJson: string): WebhookConfig["events"] {
  try {
    const arr = JSON.parse(eventsJson || "[]") as unknown[];
    return arr.filter((e): e is WebhookConfig["events"][number] =>
      e === "demanda.criada" || e === "demanda.comprovada"
    );
  } catch {
    return [];
  }
}

function parseContactList(json: string): WebhookContact[] {
  try {
    const arr = JSON.parse(json || "[]") as unknown[];
    return arr.filter(
      (item): item is WebhookContact =>
        typeof item === "object" &&
        item !== null &&
        "phone" in item &&
        typeof (item as WebhookContact).phone === "string"
    ).map((c) => ({ phone: c.phone.trim(), name: c.name?.trim() || undefined }));
  } catch {
    return [];
  }
}

export class WebhookConfigSqliteRepository implements IWebhookConfigRepository {
  async get(): Promise<WebhookConfig | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM webhook_config WHERE id = ?")
      .get(ROW_ID) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      url: String(row.url ?? ""),
      enabled: Number(row.enabled) === 1,
      events: parseEvents(String(row.events ?? "[]")),
      whatsappMod: Number(row.whatsapp_mod) === 1,
      contactList: parseContactList(String(row.contact_list ?? "[]")),
      createdAt: row.createdAt ? String(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    };
  }

  async save(input: WebhookConfigInput): Promise<WebhookConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const eventsJson = JSON.stringify(input.events ?? []);
    const contactListJson = JSON.stringify(input.contactList ?? []);

    const existing = await this.get();
    if (existing) {
      db.prepare(
        `UPDATE webhook_config SET url = ?, enabled = ?, events = ?, whatsapp_mod = ?, contact_list = ?, updatedAt = ? WHERE id = ?`
      ).run(
        input.url,
        input.enabled ? 1 : 0,
        eventsJson,
        input.whatsappMod ? 1 : 0,
        contactListJson,
        now,
        ROW_ID
      );
    } else {
      db.prepare(
        `INSERT INTO webhook_config (id, url, enabled, events, whatsapp_mod, contact_list, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        ROW_ID,
        input.url,
        input.enabled ? 1 : 0,
        eventsJson,
        input.whatsappMod ? 1 : 0,
        contactListJson,
        now,
        now
      );
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração de webhook");
    return saved;
  }
}
