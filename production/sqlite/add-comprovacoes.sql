-- Migração: criar tabelas comprovacoes + comprovacao_demandas
-- Rodar: npm run db:migrate -- add-comprovacoes
-- Se houver dados em demanda_comprovacoes, rodar depois: npm run db:migrate -- migrate-comprovacoes-nm

CREATE TABLE IF NOT EXISTS comprovacoes (
  id TEXT PRIMARY KEY,
  nomeArquivo TEXT NOT NULL,
  tipoArquivo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  caminhoArquivo TEXT NOT NULL,
  descricao TEXT,
  autor TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comprovacao_demandas (
  comprovacao_id TEXT NOT NULL REFERENCES comprovacoes(id) ON DELETE CASCADE,
  demanda_id TEXT NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  PRIMARY KEY (comprovacao_id, demanda_id)
);

CREATE INDEX IF NOT EXISTS idx_comprovacao_demandas_comprovacao ON comprovacao_demandas (comprovacao_id);

CREATE INDEX IF NOT EXISTS idx_comprovacao_demandas_demanda ON comprovacao_demandas (demanda_id);
