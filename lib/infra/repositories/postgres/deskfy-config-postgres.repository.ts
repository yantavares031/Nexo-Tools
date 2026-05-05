import type { DeskfyIntegrationConfig } from "@/types/globals";
import type {
  DeskfyUpsertSettingsInput,
  IDeskfyConfigRepository,
} from "@/lib/domain/deskfy-config.repository";
import { getPool } from "@/lib/infra/db-pg";

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

export class DeskfyConfigPostgresRepository implements IDeskfyConfigRepository {
  async get(): Promise<DeskfyIntegrationConfig | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM deskfy_config WHERE id = $1", [ROW_ID]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async upsertSettings(input: DeskfyUpsertSettingsInput): Promise<DeskfyIntegrationConfig> {
    const pool = getPool();
    const now = new Date().toISOString();
    const baseUrl = input.baseUrl.trim() || DEFAULT_BASE;
    const lookbackDays = input.lookbackDays;

    const existing = await this.get();
    if (existing) {
      await pool.query(
        `UPDATE deskfy_config SET base_url = $1, lookback_days = $2, updated_at = $3 WHERE id = $4`,
        [baseUrl, lookbackDays, now, ROW_ID]
      );
    } else {
      await pool.query(
        `INSERT INTO deskfy_config (id, base_url, api_key, lookback_days, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [ROW_ID, baseUrl, "", lookbackDays, now]
      );
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir configuração Deskfy.");
    return saved;
  }

  async setApiKey(apiKey: string): Promise<DeskfyIntegrationConfig> {
    const pool = getPool();
    const now = new Date().toISOString();
    const key = apiKey.trim();

    const existing = await this.get();
    if (existing) {
      await pool.query(`UPDATE deskfy_config SET api_key = $1, updated_at = $2 WHERE id = $3`, [
        key,
        now,
        ROW_ID,
      ]);
    } else {
      await pool.query(
        `INSERT INTO deskfy_config (id, base_url, api_key, lookback_days, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [ROW_ID, DEFAULT_BASE, key, DEFAULT_LOOKBACK, now]
      );
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar chave API Deskfy.");
    return saved;
  }
}
