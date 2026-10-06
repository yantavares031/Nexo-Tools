-- Migração: revogação de sessões (desconectar usuário pelo painel admin)
-- Rodar: npm run db:migrate -- add-user-session-revocations

CREATE TABLE IF NOT EXISTS user_session_revocations (
  user_id TEXT PRIMARY KEY,
  revoked_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
