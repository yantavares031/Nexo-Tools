-- Migração: deskfy_config (Integrações → Deskfy)
CREATE TABLE IF NOT EXISTS deskfy_config (
  id TEXT PRIMARY KEY,
  base_url TEXT NOT NULL DEFAULT 'https://service-api.deskfy.io',
  api_key TEXT NOT NULL DEFAULT '',
  lookback_days INTEGER NOT NULL DEFAULT 30,
  updated_at TEXT
);
