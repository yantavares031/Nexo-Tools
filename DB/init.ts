import type Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initDb(database: Database.Database): void {
  // Resolve schema.sql relative to this file's directory
  const SCHEMA_PATH = path.join(__dirname, "schema.sql");
  
  let schema: string;
  try {
    if (!fs.existsSync(SCHEMA_PATH)) {
      throw new Error(`Schema file not found at ${SCHEMA_PATH}`);
    }
    schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  } catch (error) {
    console.warn(`Schema file not found at ${SCHEMA_PATH}. Creating tables from inline SQL.`);
    // Se o arquivo não existir, cria as tabelas diretamente
    schema = `
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
    `;
  }
  database.exec(schema);

  // Migração: adicionar coluna acesso em users se não existir (bancos antigos)
  try {
    const tableInfo = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const hasAcesso = tableInfo.some((col) => col.name === "acesso");
    if (!hasAcesso) {
      database.exec("ALTER TABLE users ADD COLUMN acesso INTEGER NOT NULL DEFAULT 1");
    }
  } catch {
    // ignora erro (tabela pode não existir ainda)
  }

  // Tabela webhook_config (se schema antigo não tiver)
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS webhook_config (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL DEFAULT '',
        enabled INTEGER NOT NULL DEFAULT 0,
        events TEXT NOT NULL DEFAULT '[]',
        whatsapp_mod INTEGER NOT NULL DEFAULT 0,
        contact_list TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
  } catch {
    // ignora
  }

  // Migração: colunas whatsapp_mod e contact_list em webhook_config (bancos antigos)
  try {
    const tableInfo = database.prepare("PRAGMA table_info(webhook_config)").all() as { name: string }[];
    if (!tableInfo.some((col) => col.name === "whatsapp_mod")) {
      database.exec("ALTER TABLE webhook_config ADD COLUMN whatsapp_mod INTEGER NOT NULL DEFAULT 0");
    }
    if (!tableInfo.some((col) => col.name === "contact_list")) {
      database.exec("ALTER TABLE webhook_config ADD COLUMN contact_list TEXT NOT NULL DEFAULT '[]'");
    }
  } catch {
    // ignora
  }
}
