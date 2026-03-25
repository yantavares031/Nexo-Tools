-- Senha temporária (primeiro acesso). Execute em bancos já existentes.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "temporaryPassword" TEXT;
