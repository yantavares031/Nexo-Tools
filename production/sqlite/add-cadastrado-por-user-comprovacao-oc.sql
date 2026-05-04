-- Quem cadastrou comprovação / OC (avatar na listagem)
ALTER TABLE comprovacoes ADD COLUMN cadastradoPorUserId TEXT;
ALTER TABLE ordens_compra ADD COLUMN cadastradoPorUserId TEXT;
