-- Aditivo: foto de perfil (R2). Seguro para produção — não remove dados.
-- db:migrate ignora se a coluna já existir (SQLite).
ALTER TABLE users ADD COLUMN avatarKey TEXT;
