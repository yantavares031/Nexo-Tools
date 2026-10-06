-- Migração: revogação de sessões (desconectar usuário pelo painel admin)
-- Rodar: npm run db:migrate -- add-user-session-revocations

CREATE TABLE IF NOT EXISTS user_session_revocations (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  revoked_at BIGINT NOT NULL
);
