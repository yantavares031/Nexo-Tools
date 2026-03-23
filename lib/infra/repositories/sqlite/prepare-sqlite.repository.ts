import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { IPrepareRepository } from "@/lib/domain/prepare.repository";
import { resolveSqliteDatabasePath } from "@/lib/infra/sqlite-db-path";

export class PrepareSqliteRepository implements IPrepareRepository {
  async prepare_db(): Promise<void> {
    const schemaPath = path.join(process.cwd(), "production", "schema-sqlite.sql");
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema não encontrado: ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    const dbPath = resolveSqliteDatabasePath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const db = new Database(dbPath);
    try {
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      db.exec(schemaSql);
    } finally {
      db.close();
    }
  }
}
