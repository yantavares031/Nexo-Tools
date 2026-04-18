-- Quem enviou a OC (notificar agência quando assinada)
ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS "enviadoPorEmail" TEXT;
