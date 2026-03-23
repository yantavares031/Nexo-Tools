import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import type { Agencia, AgenciaInput } from "@/types/globals";
import { getPool } from "@/lib/infra/db-pg";

function rowToAgencia(row: Record<string, unknown>): Agencia {
  return {
    id: String(row.id),
    nomeFantasia: String(row.nomeFantasia),
    cnpj: String(row.cnpj),
    orcamentoAnual: Number(row.orcamentoAnual),
    boardId: row.boardId ? String(row.boardId) : undefined,
  };
}

export class AgenciaPostgresRepository implements IAgenciaRepository {
  async findAll(): Promise<Agencia[]> {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM agencias ORDER BY "nomeFantasia"');
    return (result.rows as Record<string, unknown>[]).map(rowToAgencia);
  }

  async findById(id: string): Promise<Agencia | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM agencias WHERE id = $1", [id]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToAgencia(row) : null;
  }

  async create(input: AgenciaInput): Promise<Agencia> {
    const id = String(Date.now());
    const pool = getPool();
    await pool.query(
      'INSERT INTO agencias (id, "nomeFantasia", cnpj, "orcamentoAnual", "boardId") VALUES ($1, $2, $3, $4, $5)',
      [id, input.nomeFantasia, input.cnpj, input.orcamentoAnual, input.boardId ?? null]
    );
    return { ...input, id };
  }

  async update(id: string, input: AgenciaInput): Promise<Agencia> {
    const pool = getPool();
    const rowResult = await pool.query("SELECT id FROM agencias WHERE id = $1", [id]);
    if (rowResult.rows.length === 0) throw new Error("Agência não encontrada");
    await pool.query(
      'UPDATE agencias SET "nomeFantasia" = $1, cnpj = $2, "orcamentoAnual" = $3, "boardId" = $4 WHERE id = $5',
      [input.nomeFantasia, input.cnpj, input.orcamentoAnual, input.boardId ?? null, id]
    );
    return { ...input, id };
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    await pool.query("DELETE FROM agencias WHERE id = $1", [id]);
  }
}
