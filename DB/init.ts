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
    `;
  }
  database.exec(schema);
}
