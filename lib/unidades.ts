import { getDb } from "@/DB/db";

/**
 * Retorna todas as unidades cadastradas no banco, ordenadas alfabeticamente.
 */
export function getUnidades(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT nome FROM unidades ORDER BY nome").all() as Array<{ nome: string }>;
  return rows.map((r) => r.nome);
}
