ALTER TABLE whatsapp_integration ADD COLUMN IF NOT EXISTS async_msg_delay_min INTEGER NOT NULL DEFAULT 3;
ALTER TABLE whatsapp_integration ADD COLUMN IF NOT EXISTS async_msg_delay_max INTEGER NOT NULL DEFAULT 5;
