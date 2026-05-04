-- Quem cadastrou comprovação / OC (avatar na listagem)
ALTER TABLE comprovacoes ADD COLUMN IF NOT EXISTS "cadastradoPorUserId" TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS "cadastradoPorUserId" TEXT REFERENCES users(id) ON DELETE SET NULL;
