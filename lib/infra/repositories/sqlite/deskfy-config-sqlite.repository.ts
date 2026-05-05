import type { DeskfyIntegrationConfig } from "@/types/globals";
import type {
  DeskfyUpsertSettingsInput,
  IDeskfyConfigRepository,
} from "@/lib/domain/deskfy-config.repository";
import { getDb } from "@/DB/db";

const ROW_ID = "default";

const DEFAULT_BASE = "https://service-api.deskfy.io";
const DEFAULT_LOOKBACK = 30;

function rowToConfig(row: Record<string, unknown>): DeskfyIntegrationConfig {
  return {
    id: String(row.id),
    baseUrl: String(row.base_url ?? DEFAULT_BASE),
    apiKey: String(row.api_key ?? ""),
    lookbackDays: Number(row.lookback_days ?? DEFAULT_LOOKBACK),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export class DeskfyConfigSqliteRepository implements IDeskfyConfigRepository {
  async get(): Promise<DeskfyIntegrationConfig | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM deskfy_config WHERE id = ?")
      .get(ROW_ID) as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async upsertSettings(input: DeskfyUpsertSettingsInput): Promise<DeskfyIntegrationConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const baseUrl = input.baseUrl.trim() || DEFAULT_BASE;
    const lookbackDays = input.lookbackDays;

    const existing = await this.get();
    if (existing) {
      db.prepare(
        `UPDATE deskfy_config SET base_url = ?, lookback_days = ?, updated_at = ? WHERE id = ?`
      ).run(baseUrl, lookbackDays, now, ROW_ID);
    } else {
      db.prepare(
        `INSERT INTO deskfy_config (id, base_url, api_key, lookback_days, updated_at) VALUES (?, ?, ?, ?, ?)`
      ).run(ROW_ID, baseUrl, "", lookbackDays, now);
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração Deskfy.");
    return saved;
  }

  async setApiKey(apiKey: string): Promise<DeskfyIntegrationConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const key = apiKey.trim();

    const existing = await this.get();
    if (existing) {
      db.prepare(`UPDATE deskfy_config SET api_key = ?, updated_at = ? WHERE id = ?`).run(
        key,
        now,
        ROW_ID
      );
    } else {
      db.prepare(
        `INSERT INTO deskfy_config (id, base_url, api_key, lookback_days, updated_at) VALUES (?, ?, ?, ?, ?)`
      ).run(ROW_ID, DEFAULT_BASE, key, DEFAULT_LOOKBACK, now);
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar chave API Deskfy.");
    return saved;
  }
}
