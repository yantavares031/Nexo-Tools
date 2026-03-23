import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { Solicitante, SolicitanteInput } from "@/types/globals";
import { getPool } from "@/lib/infra/db-pg";

function rowToSolicitante(row: Record<string, unknown>): Solicitante {
  return {
    id: String(row.id),
    nome: String(row.nome),
    unResponsavel: String(row.unResponsavel),
  };
}

export class SolicitantePostgresRepository implements ISolicitanteRepository {
  async findAll(): Promise<Solicitante[]> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM solicitantes ORDER BY nome");
    return (result.rows as Record<string, unknown>[]).map(rowToSolicitante);
  }

  async create(input: SolicitanteInput): Promise<Solicitante> {
    const id = String(Date.now());
    const pool = getPool();
    await pool.query(
      'INSERT INTO solicitantes (id, nome, "unResponsavel") VALUES ($1, $2, $3)',
      [id, input.nome, input.unResponsavel]
    );
    return { ...input, id };
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    await pool.query("DELETE FROM solicitantes WHERE id = $1", [id]);
  }
}
