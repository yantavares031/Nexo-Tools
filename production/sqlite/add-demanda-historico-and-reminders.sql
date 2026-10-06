-- Migração: linha do tempo da demanda + configuração de lembretes de pendências
-- Rodar: npm run db:migrate -- add-demanda-historico-and-reminders

CREATE TABLE IF NOT EXISTS demanda_historico (
  id TEXT PRIMARY KEY,
  demandaId TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  alteracoes TEXT NOT NULL DEFAULT '[]',
  autor TEXT NOT NULL,
  autorUserId TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (demandaId) REFERENCES demandas(id) ON DELETE CASCADE,
  FOREIGN KEY (autorUserId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_demanda_historico_demandaId ON demanda_historico (demandaId);

CREATE TABLE IF NOT EXISTS pending_reminder_config (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  ordem_compra_days INTEGER NOT NULL DEFAULT 3,
  comprovacao_days INTEGER NOT NULL DEFAULT 7,
  last_run_at TEXT,
  last_run_summary TEXT,
  updated_at TEXT
);
