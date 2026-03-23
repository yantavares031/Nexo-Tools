-- Migração: demanda_comprovacoes → comprovacoes + comprovacao_demandas (modelo N:M)
-- Rodar: npm run db:migrate -- migrate-comprovacoes-nm
-- Nota: SQLite init.ts já faz essa migração automaticamente. Este arquivo é para rodar manualmente se necessário.
INSERT OR IGNORE INTO comprovacoes (id, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, descricao, autor, createdAt)
SELECT id, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, descricao, autor, createdAt
FROM demanda_comprovacoes;

INSERT OR IGNORE INTO comprovacao_demandas (comprovacao_id, demanda_id)
SELECT id, demandaId
FROM demanda_comprovacoes;
