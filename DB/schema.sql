-- NEXO Tools - Schema SQLite

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'agency')),
  agenciaId TEXT,
  acesso INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS agencias (
  id TEXT PRIMARY KEY,
  nomeFantasia TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  orcamentoAnual REAL NOT NULL DEFAULT 0
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
  status TEXT NOT NULL CHECK (status IN ('faturado', 'comprometido')),
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
