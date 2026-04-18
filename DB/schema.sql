-- NEXO Tools - Schema SQLite

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'agency')),
  agenciaId TEXT,
  acesso INTEGER NOT NULL DEFAULT 1,
  temporaryPassword TEXT
);

CREATE TABLE IF NOT EXISTS agencias (
  id TEXT PRIMARY KEY,
  nomeFantasia TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  orcamentoAnual REAL NOT NULL DEFAULT 0,
  boardId TEXT
);

CREATE TABLE IF NOT EXISTS solicitantes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  unResponsavel TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS demandas (
  id TEXT PRIMARY KEY,
  demanda TEXT NOT NULL,
  solicitante TEXT NOT NULL,
  unResponsavel TEXT NOT NULL,
  obs TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('faturado', 'comprometido', 'entregue')),
  valor REAL NOT NULL DEFAULT 0,
  centroDeCusto TEXT DEFAULT '',
  ocPi TEXT DEFAULT '',
  mes TEXT DEFAULT '',
  agencia TEXT,
  agenciaId TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS unidades (
  nome TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS centros_custo (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT
);

-- Comprovações (anexos) — entidade independente, vinculada a demandas via comprovacao_demandas
CREATE TABLE IF NOT EXISTS comprovacoes (
  id TEXT PRIMARY KEY,
  nomeArquivo TEXT NOT NULL,
  tipoArquivo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  caminhoArquivo TEXT NOT NULL,
  descricao TEXT,
  autor TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comprovacao_demandas (
  comprovacao_id TEXT NOT NULL REFERENCES comprovacoes(id) ON DELETE CASCADE,
  demanda_id TEXT NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  PRIMARY KEY (comprovacao_id, demanda_id)
);

CREATE INDEX IF NOT EXISTS idx_comprovacao_demandas_comprovacao ON comprovacao_demandas (comprovacao_id);
CREATE INDEX IF NOT EXISTS idx_comprovacao_demandas_demanda ON comprovacao_demandas (demanda_id);

-- Ordens de compra (OC): documento PDF para assinatura do gerente, vinculado a uma demanda
CREATE TABLE IF NOT EXISTS ordens_compra (
  id TEXT PRIMARY KEY,
  demandaId TEXT NOT NULL,
  nomeArquivo TEXT NOT NULL,
  tipoArquivo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  caminhoArquivo TEXT NOT NULL,
  nomeArquivoAssinado TEXT,
  tipoArquivoAssinado TEXT,
  tamanhoAssinado INTEGER,
  caminhoArquivoAssinado TEXT,
  status TEXT NOT NULL CHECK (status IN ('em_aberto', 'assinada')),
  autor TEXT NOT NULL,
  enviadoPorEmail TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT,
  FOREIGN KEY (demandaId) REFERENCES demandas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ordens_compra_demandaId ON ordens_compra (demandaId);
CREATE INDEX IF NOT EXISTS idx_ordens_compra_status ON ordens_compra (status);
CREATE INDEX IF NOT EXISTS idx_ordens_compra_createdAt ON ordens_compra (createdAt);

CREATE TABLE IF NOT EXISTS demanda_comprovacoes (
  id TEXT PRIMARY KEY,
  demandaId TEXT NOT NULL,
  nomeArquivo TEXT NOT NULL,
  tipoArquivo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  caminhoArquivo TEXT NOT NULL,
  descricao TEXT,
  autor TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (demandaId) REFERENCES demandas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS demanda_centros_custo (
  id TEXT PRIMARY KEY,
  demandaId TEXT NOT NULL,
  centroDeCusto TEXT NOT NULL,
  valor REAL NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (demandaId) REFERENCES demandas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_demandas_search ON demandas (demanda, ocPi);
CREATE INDEX IF NOT EXISTS idx_demandas_solicitante ON demandas (solicitante);
CREATE INDEX IF NOT EXISTS idx_demandas_unResponsavel ON demandas (unResponsavel);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas (status);
CREATE INDEX IF NOT EXISTS idx_demandas_agencia ON demandas (agencia);
CREATE INDEX IF NOT EXISTS idx_demandas_agenciaId ON demandas (agenciaId);
CREATE INDEX IF NOT EXISTS idx_demanda_comprovacoes_demandaId ON demanda_comprovacoes (demandaId);
CREATE INDEX IF NOT EXISTS idx_demanda_comprovacoes_createdAt ON demanda_comprovacoes (createdAt);
CREATE INDEX IF NOT EXISTS idx_demanda_centros_custo_demandaId ON demanda_centros_custo (demandaId);
CREATE INDEX IF NOT EXISTS idx_demanda_centros_custo_ordem ON demanda_centros_custo (demandaId, ordem);

CREATE TABLE IF NOT EXISTS demanda_mensagens (
  id TEXT PRIMARY KEY,
  demandaId TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  autor TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (demandaId) REFERENCES demandas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_demanda_mensagens_demandaId ON demanda_mensagens (demandaId);

-- Boards Deskfy permitidos na importação (Integrações > Filtro de Boards)
CREATE TABLE IF NOT EXISTS deskfy_import_boards (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_deskfy_import_boards_nome ON deskfy_import_boards (nome);

-- Configuração global de webhook (uma única linha). Método sempre POST.
CREATE TABLE IF NOT EXISTS webhook_config (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  events TEXT NOT NULL DEFAULT '[]',
  whatsapp_mod INTEGER NOT NULL DEFAULT 0,
  contact_list TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT,
  updatedAt TEXT
);

-- SMTP (Gmail / integrações — uma única linha)
CREATE TABLE IF NOT EXISTS smtp_config (
  id TEXT PRIMARY KEY,
  smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL DEFAULT '',
  smtp_password TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  ordem_compra_notify_emails TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT
);

-- Histórico de backups enviados ao armazenamento (ex.: R2)
CREATE TABLE IF NOT EXISTS backup_runs (
  id TEXT PRIMARY KEY,
  executed_at TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  driver_db TEXT NOT NULL,
  size_bytes INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_backup_runs_executed_at ON backup_runs (executed_at);

-- Admin padrão (primeiro acesso). Idempotente: só insere se não existir este id ou e-mail.
INSERT INTO users (id, email, password, name, role, agenciaId, acesso)
SELECT 'a0000000-0000-4000-8000-000000000001',
       'support@nexo.com',
       '32718839Yan*',
       'Suporte',
       'admin',
       NULL,
       1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'a0000000-0000-4000-8000-000000000001' OR email = 'support@nexo.com');
