import { getDb } from "@/DB/db";
import { getPool } from "@/lib/infra/db-pg";
import { isPostgres } from "@/lib/infra/db-driver";

/**
 * Retorna todas as unidades cadastradas no banco, ordenadas alfabeticamente.
 */
export async function getUnidades(): Promise<string[]> {
  if (isPostgres()) {
    const pool = getPool();
    const result = await pool.query("SELECT nome FROM unidades ORDER BY nome");
    return (result.rows as Array<{ nome: string }>).map((r) => r.nome);
  }
  const db = getDb();
  const rows = db.prepare("SELECT nome FROM unidades ORDER BY nome").all() as Array<{ nome: string }>;
  return rows.map((r) => r.nome);
}
