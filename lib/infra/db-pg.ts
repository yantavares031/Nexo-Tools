/**
 * Conexão PostgreSQL via pg (node-postgres).
 * Usado quando ACTIVE_DRIVER_DB=POSTGRE.
 */
import { Pool } from "pg";

let pool: Pool | null = null;

/**
 * Retorna o pool de conexões PostgreSQL (singleton).
 * Variável de ambiente: DATABASE_URL (ex.: postgresql://user:pass@host:5432/dbname).
 */
export function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL é obrigatória quando ACTIVE_DRIVER_DB=POSTGRE. Ex.: postgresql://user:pass@host:5432/dbname"
    );
  }
  pool = new Pool({ connectionString: url });
  return pool;
}

/** Fecha o pool (útil para shutdown). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
