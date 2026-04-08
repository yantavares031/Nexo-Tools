-- Migração: smtp_config
-- npm run db:migrate -- add-smtp-config

CREATE TABLE IF NOT EXISTS smtp_config (
  id TEXT PRIMARY KEY,
  smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL DEFAULT '',
  smtp_password TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);
