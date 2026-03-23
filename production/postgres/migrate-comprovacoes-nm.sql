-- Migração: demanda_comprovacoes → comprovacoes + comprovacao_demandas (modelo N:M)
-- Rodar: npm run db:migrate -- migrate-comprovacoes-nm
INSERT INTO comprovacoes (id, "nomeArquivo", "tipoArquivo", tamanho, "caminhoArquivo", descricao, autor, "createdAt")
SELECT id, "nomeArquivo", "tipoArquivo", tamanho, "caminhoArquivo", descricao, autor, "createdAt"
FROM demanda_comprovacoes
ON CONFLICT (id) DO NOTHING;

INSERT INTO comprovacao_demandas (comprovacao_id, demanda_id)
SELECT id, "demandaId"
FROM demanda_comprovacoes
ON CONFLICT (comprovacao_id, demanda_id) DO NOTHING;
