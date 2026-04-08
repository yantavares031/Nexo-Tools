-- Metadados do PDF da OC já assinada (admin). Execute em bancos já existentes.
ALTER TABLE ordens_compra ADD COLUMN nomeArquivoAssinado TEXT;
ALTER TABLE ordens_compra ADD COLUMN tipoArquivoAssinado TEXT;
ALTER TABLE ordens_compra ADD COLUMN tamanhoAssinado INTEGER;
ALTER TABLE ordens_compra ADD COLUMN caminhoArquivoAssinado TEXT;
