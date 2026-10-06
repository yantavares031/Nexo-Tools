-- Migração: alertas de capacidade anual das agências (WhatsApp)
-- Rodar: npm run db:migrate -- add-capacity-alerts

CREATE TABLE IF NOT EXISTS capacity_alert_config (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  thresholds TEXT NOT NULL DEFAULT '[80,100]',
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS capacity_alert_sent (
  id TEXT PRIMARY KEY,
  agencia_id TEXT NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  percentual DOUBLE PRECISION NOT NULL,
  sent_at TEXT NOT NULL,
  UNIQUE (agencia_id, year, threshold)
);
