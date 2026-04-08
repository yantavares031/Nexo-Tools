-- Migração: tabela ordens_compra (pedido de assinatura de OC, PDF + demanda)
-- Rodar: npm run db:migrate -- add-ordens-compra

CREATE TABLE IF NOT EXISTS ordens_compra (
  id TEXT PRIMARY KEY,
  "demandaId" TEXT NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  "nomeArquivo" TEXT NOT NULL,
  "tipoArquivo" TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  "caminhoArquivo" TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('em_aberto', 'assinada')),
  autor TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT
);

CREATE INDEX IF NOT EXISTS idx_ordens_compra_demandaId ON ordens_compra ("demandaId");
CREATE INDEX IF NOT EXISTS idx_ordens_compra_status ON ordens_compra (status);
CREATE INDEX IF NOT EXISTS idx_ordens_compra_createdAt ON ordens_compra ("createdAt");
