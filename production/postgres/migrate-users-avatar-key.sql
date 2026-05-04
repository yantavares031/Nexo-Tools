-- Aditivo: foto de perfil (R2). Seguro para produção — não remove dados.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;
