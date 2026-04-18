-- E-mails que recebem notificações de ordem de compra (integrações > SMTP)
ALTER TABLE smtp_config ADD COLUMN IF NOT EXISTS ordem_compra_notify_emails TEXT NOT NULL DEFAULT '[]';
