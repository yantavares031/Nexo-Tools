import fs from "fs";
import path from "path";
import type { IPrepareRepository } from "@/lib/domain/prepare.repository";
import { getPool } from "@/lib/infra/db-pg";

export class PreparePostgresRepository implements IPrepareRepository {
  async prepare_db(): Promise<void> {
    const schemaPath = path.join(process.cwd(), "production", "schema-postgres.sql");
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema não encontrado: ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query(schemaSql);
    } finally {
      client.release();
    }
  }
}
