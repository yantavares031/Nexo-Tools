ALTER TABLE whatsapp_integration ADD COLUMN IF NOT EXISTS notify_recipients_json TEXT NOT NULL DEFAULT '[]';
