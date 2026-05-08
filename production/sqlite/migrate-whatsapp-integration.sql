CREATE TABLE IF NOT EXISTS whatsapp_integration (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'uazapi',
  base_url TEXT NOT NULL DEFAULT '',
  admin_token TEXT NOT NULL DEFAULT '',
  api_token TEXT NOT NULL DEFAULT '',
  selected_instance_id TEXT,
  instance_token TEXT NOT NULL DEFAULT '',
  instance_name TEXT,
  instance_status TEXT,
  profile_name TEXT,
  profile_pic_url TEXT,
  profile_pic_storage_key TEXT,
  business_profile_json TEXT,
  instance_payload_json TEXT,
  provider_fields_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT
);
