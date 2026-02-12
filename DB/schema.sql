-- NEXO Tools - Schema SQLite

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'agency')),
  agenciaId TEXT
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

CREATE INDEX IF NOT EXISTS idx_demandas_search ON demandas (demanda, ocPi);
CREATE INDEX IF NOT EXISTS idx_demandas_solicitante ON demandas (solicitante);
CREATE INDEX IF NOT EXISTS idx_demandas_unResponsavel ON demandas (unResponsavel);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas (status);
CREATE INDEX IF NOT EXISTS idx_demandas_agencia ON demandas (agencia);
CREATE INDEX IF NOT EXISTS idx_demandas_agenciaId ON demandas (agenciaId);
