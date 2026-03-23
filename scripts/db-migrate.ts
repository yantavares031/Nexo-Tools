/**
 * Executa um arquivo SQL de migração no banco conforme ACTIVE_DRIVER_DB (Postgres ou SQLite).
 * O arquivo é buscado em production/postgres/<arquivo>.sql ou production/sqlite/<arquivo>.sql
 *
 * Uso: npm run db:migrate -- <nome-do-arquivo>
 * Exemplos:
 *   npm run db:migrate -- migrate-exemplo
 *   docker compose run --rm app npm run db:migrate -- migrate-exemplo
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { getActiveDbDriver } from "@/lib/infra/db-driver";
import { getPool, closePool } from "@/lib/infra/db-pg";
import { resolveSqliteDatabasePath } from "@/lib/infra/sqlite-db-path";

/** Remove linhas que são só comentário (-- no início após trim). */
function stripLineComments(sql: string): string {
  return sql
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
}

function splitSqlStatements(sql: string): string[] {
  const cleaned = stripLineComments(sql);
  return cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const ALTER_ADD_COL_RE =
  /^ALTER\s+TABLE\s+["`]?(\w+)["`]?\s+ADD\s+COLUMN\s+["`]?(\w+)/i;

function sqliteShouldSkipAddColumn(db: Database.Database, stmt: string): boolean {
  const m = stmt.match(ALTER_ADD_COL_RE);
  if (!m) return false;
  const table = m[1];
  const col = m[2];
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name.toLowerCase() === col.toLowerCase());
}

async function migratePostgres(sql: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  const statements = splitSqlStatements(sql);
  try {
    await client.query("BEGIN");
    for (const st of statements) {
      await client.query(st);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

function migrateSqlite(sql: string): void {
  const dbPath = resolveSqliteDatabasePath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Arquivo SQLite não encontrado: ${dbPath}`);
  }
  const db = new Database(dbPath);
  try {
    db.pragma("foreign_keys = ON");
    const statements = splitSqlStatements(sql);
    for (const st of statements) {
      if (sqliteShouldSkipAddColumn(db, st)) {
        console.log(`[db:migrate] SQLite: ignorando (coluna já existe): ${st.slice(0, 80)}...`);
        continue;
      }
      db.exec(`${st};`);
    }
  } finally {
    db.close();
  }
}

async function migrate(): Promise<void> {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error("[db:migrate] Informe o nome do arquivo SQL como argumento.");
    console.error("  Exemplo: npm run db:migrate -- migrate-exemplo");
    process.exit(1);
  }

  const driver = getActiveDbDriver();
  const driverFolder = driver === "POSTGRE" ? "postgres" : "sqlite";
  const baseName = fileName.endsWith(".sql") ? fileName : `${fileName}.sql`;
  const filePath = path.join("production", driverFolder, baseName);
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`[db:migrate] Arquivo não encontrado: ${absolutePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(absolutePath, "utf-8");
  console.log(`[db:migrate] Driver: ${driver}, arquivo: ${filePath}`);

  if (driver === "POSTGRE") {
    await migratePostgres(sql);
  } else {
    migrateSqlite(sql);
  }

  console.log("[db:migrate] Migração aplicada com sucesso.");
}

async function run(): Promise<void> {
  let exitCode = 0;
  try {
    await migrate();
  } catch (err) {
    console.error("[db:migrate] Erro:", err);
    exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch {
      // SQLite
    }
  }
  process.exit(exitCode);
}

void run();
