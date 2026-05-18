-- Migração: tabela certidoes (anexos sem vínculo com demanda)
-- Rodar: npm run db:migrate -- add-certidoes

CREATE TABLE IF NOT EXISTS certidoes (
  id TEXT PRIMARY KEY,
  nomeArquivo TEXT NOT NULL,
  tipoArquivo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  caminhoArquivo TEXT NOT NULL,
  descricao TEXT,
  autor TEXT NOT NULL,
  cadastradoPorUserId TEXT,
  agenciaId TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (cadastradoPorUserId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (agenciaId) REFERENCES agencias(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_certidoes_agenciaId ON certidoes (agenciaId);
CREATE INDEX IF NOT EXISTS idx_certidoes_createdAt ON certidoes (createdAt);
