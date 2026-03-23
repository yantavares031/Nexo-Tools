import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb } from "./init";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = __dirname;
const DB_PATH = path.join(DB_DIR, "nexo.db");

/** Caminho absoluto do arquivo nexo.db (útil para scripts de backup). */
export function getSqliteDbFilePath(): string {
  return DB_PATH;
}

let db: Database.Database | null = null;

/** Retorna a conexão SQLite (singleton). Cria tabelas se não existirem. */
export function getDb(): Database.Database {
  if (db) return db;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initDb(db);
  return db;
}

/** Fecha a conexão (útil para testes ou shutdown). */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
