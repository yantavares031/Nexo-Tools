-- Metadados do PDF da OC já assinada (admin), armazenado no R2.
ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS "nomeArquivoAssinado" TEXT;
ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS "tipoArquivoAssinado" TEXT;
ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS "tamanhoAssinado" INTEGER;
ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS "caminhoArquivoAssinado" TEXT;
