/**
 * Gera dump do banco ativo (PostgreSQL ou SQLite), envia ao armazenamento configurado
 * (ACTIVE_PROVIDER_BACKUP=R2) e registra em backup_runs.
 *
 * Requer .env com driver, credenciais de banco e R2 (quando R2).
 * Uso: npm run backup
 * Cron (ex.): 0 3 * * * cd /caminho && npm run backup
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { closeDb, getDb, getSqliteDbFilePath } from "@/DB/db";
import { getActiveDbDriver, isPostgres } from "@/lib/infra/db-driver";
import { closePool, getPool } from "@/lib/infra/db-pg";
import { appLogger } from "@/lib/logger";
import { getBackupStorageProvider } from "@/services/backup-storage";

function timestampForFilename(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function createPostgresDump(outPath: string): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL é obrigatória para backup PostgreSQL.");
  }
  const r = spawnSync("pg_dump", ["-Fc", "-f", outPath, url], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) {
    throw new Error(`pg_dump: ${r.error.message}`);
  }
  if (r.status !== 0) {
    throw new Error(r.stderr || `pg_dump saiu com código ${r.status ?? "?"}`);
  }
}

async function createSqliteBackup(outPath: string): Promise<void> {
  const sqlitePath = getSqliteDbFilePath();
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`Arquivo SQLite não encontrado: ${sqlitePath}`);
  }
  const src = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  try {
    await src.backup(outPath);
  } finally {
    src.close();
  }
}

async function insertBackupRun(input: {
  id: string;
  executedAt: string;
  filename: string;
  storageKey: string;
  driverDb: string;
  sizeBytes: number;
}): Promise<void> {
  if (isPostgres()) {
    const pool = getPool();
    await pool.query(
      `INSERT INTO backup_runs (id, executed_at, filename, storage_key, status, error_message, driver_db, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.id,
        input.executedAt,
        input.filename,
        input.storageKey,
        "success",
        null,
        input.driverDb,
        input.sizeBytes,
      ]
    );
  } else {
    const db = getDb();
    db.prepare(
      `INSERT INTO backup_runs (id, executed_at, filename, storage_key, status, error_message, driver_db, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      input.id,
      input.executedAt,
      input.filename,
      input.storageKey,
      "success",
      null,
      input.driverDb,
      input.sizeBytes
    );
  }
}

async function main(): Promise<void> {
  const driverDb = getActiveDbDriver();
  const ts = timestampForFilename();
  const suffix = randomUUID().slice(0, 8);
  const ext = isPostgres() ? "dump" : "db";
  const filename = `nexo_${ts}_${suffix}.${ext}`;
  const tempPath = path.join(os.tmpdir(), filename);

  try {
    const provider = getBackupStorageProvider();

    if (isPostgres()) {
      createPostgresDump(tempPath);
    } else {
      await createSqliteBackup(tempPath);
    }

    const buffer = fs.readFileSync(tempPath);
    const storageKey = await provider.uploadBackup(buffer, filename);

    await insertBackupRun({
      id: randomUUID(),
      executedAt: new Date().toISOString(),
      filename,
      storageKey,
      driverDb,
      sizeBytes: buffer.length,
    });

    appLogger.info(
      {
        event: "backup.success",
        storageKey,
        filename,
        driverDb,
        sizeBytes: buffer.length,
      },
      "Backup concluído"
    );
    console.log(`Backup concluído: ${storageKey} (${buffer.length} bytes)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appLogger.error({ event: "backup.failure", err: message }, "Falha no backup");
    console.error("Falha no backup:", message);
    process.exitCode = 1;
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    try {
      await closePool();
    } catch {
      // pool pode não ter sido criado
    }
    closeDb();
  }
}

void main();
