ALTER TABLE whatsapp_integration ADD COLUMN IF NOT EXISTS provider_fields_json TEXT NOT NULL DEFAULT '{}';
