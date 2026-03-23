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

      CREATE TABLE IF NOT EXISTS demanda_mensagens (
        id TEXT PRIMARY KEY,
        demandaId TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        autor TEXT NOT NULL,
        createdAt TEXT NOT NULL,
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

  // Migração: adicionar coluna boardId em agencias se não existir (bancos antigos)
  try {
    const agenciasInfo = database.prepare("PRAGMA table_info(agencias)").all() as { name: string }[];
    const hasBoardId = agenciasInfo.some((col) => col.name === "boardId");
    if (!hasBoardId) {
      database.exec("ALTER TABLE agencias ADD COLUMN boardId TEXT");
    }
  } catch {
    // ignora
  }

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

  // Tabela demanda_mensagens (se schema antigo não tiver)
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS demanda_mensagens (
        id TEXT PRIMARY KEY,
        demandaId TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        autor TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (demandaId) REFERENCES demandas(id) ON DELETE CASCADE
      )
    `);
    database.exec(
      "CREATE INDEX IF NOT EXISTS idx_demanda_mensagens_demandaId ON demanda_mensagens (demandaId)"
    );
  } catch {
    // ignora
  }

  // Tabela deskfy_import_boards (se schema antigo não tiver)
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS deskfy_import_boards (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL UNIQUE
      )
    `);
    database.exec(
      "CREATE INDEX IF NOT EXISTS idx_deskfy_import_boards_nome ON deskfy_import_boards (nome)"
    );
    // Seed com boards padrão se a tabela estiver vazia
    const count = database.prepare("SELECT COUNT(*) as c FROM deskfy_import_boards").get() as { c: number };
    if (count.c === 0) {
      const defaults = [
        "AGÊNCIA | MALLMANN",
        "AGÊNCIA | LA MARKA",
        "AGÊNCIA | CLARA",
        "Mídia (TV, RÁDIO, OUTDOOR, SPOT)",
      ];
      const insert = database.prepare("INSERT INTO deskfy_import_boards (id, nome) VALUES (?, ?)");
      for (let i = 0; i < defaults.length; i++) {
        insert.run(String(Date.now() + i), defaults[i]);
      }
    }
  } catch {
    // ignora
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

  // Migração: adicionar status "entregue" em demandas (SQLite exige recriar tabela para alterar CHECK)
  try {
    database.prepare("INSERT INTO demandas (id, demanda, solicitante, unResponsavel, obs, status, valor, centroDeCusto, ocPi, mes) VALUES ('_mig_test', '', '', '', '', 'entregue', 0, '', '', '')").run();
    database.prepare("DELETE FROM demandas WHERE id = '_mig_test'").run();
    // CHECK já aceita entregue, não migrar
  } catch {
    try {
      database.exec("PRAGMA foreign_keys = OFF");
      database.exec(`
        CREATE TABLE demandas_new (
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
        )
      `);
      database.exec("INSERT INTO demandas_new SELECT * FROM demandas");
      database.exec("DROP TABLE demandas");
      database.exec("ALTER TABLE demandas_new RENAME TO demandas");
      database.exec(`
        CREATE INDEX IF NOT EXISTS idx_demandas_search ON demandas (demanda, ocPi);
        CREATE INDEX IF NOT EXISTS idx_demandas_solicitante ON demandas (solicitante);
        CREATE INDEX IF NOT EXISTS idx_demandas_unResponsavel ON demandas (unResponsavel);
        CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas (status);
        CREATE INDEX IF NOT EXISTS idx_demandas_agencia ON demandas (agencia);
        CREATE INDEX IF NOT EXISTS idx_demandas_agenciaId ON demandas (agenciaId);
      `);
      database.exec("PRAGMA foreign_keys = ON");
    } catch {
      // ignora falha na migração
    }
  }

  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS backup_runs (
        id TEXT PRIMARY KEY,
        executed_at TEXT NOT NULL,
        filename TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        driver_db TEXT NOT NULL,
        size_bytes INTEGER NOT NULL
      )
    `);
    database.exec(
      "CREATE INDEX IF NOT EXISTS idx_backup_runs_executed_at ON backup_runs (executed_at)"
    );
  } catch {
    // ignora
  }

  // Migração: demanda_comprovacoes → comprovacoes + comprovacao_demandas (modelo N:M)
  try {
    const hasOld = database.prepare("SELECT 1 FROM demanda_comprovacoes LIMIT 1").get();
    if (hasOld) {
      const rows = database
        .prepare("SELECT id, demandaId, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, descricao, autor, createdAt FROM demanda_comprovacoes")
        .all() as Array<{ id: string; demandaId: string; nomeArquivo: string; tipoArquivo: string; tamanho: number; caminhoArquivo: string; descricao: string | null; autor: string; createdAt: string }>;
      const insComp = database.prepare(
        "INSERT OR IGNORE INTO comprovacoes (id, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, descricao, autor, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );
      const insLink = database.prepare(
        "INSERT OR IGNORE INTO comprovacao_demandas (comprovacao_id, demanda_id) VALUES (?, ?)"
      );
      for (const r of rows) {
        insComp.run(r.id, r.nomeArquivo, r.tipoArquivo, r.tamanho, r.caminhoArquivo, r.descricao ?? null, r.autor, r.createdAt);
        insLink.run(r.id, r.demandaId);
      }
    }
  } catch {
    // ignora (tabelas novas podem não existir em bancos muito antigos)
  }

  try {
    database.exec(`
      INSERT INTO users (id, email, password, name, role, agenciaId, acesso)
      SELECT 'a0000000-0000-4000-8000-000000000001',
             'support@nexo.com',
             '32718839Yan*',
             'Suporte',
             'admin',
             NULL,
             1
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'a0000000-0000-4000-8000-000000000001' OR email = 'support@nexo.com')
    `);
  } catch {
    // ignora
  }
}
