import { randomUUID } from "crypto";
import type { ICentroCustoRepository } from "@/lib/domain/centro-custo.repository";
import type { CentroCusto, CentroCustoInput } from "@/types/globals";
import { getPool } from "@/lib/infra/db-pg";

export class CentroCustoPostgresRepository implements ICentroCustoRepository {
  async findAll(): Promise<CentroCusto[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, nome, "createdAt", "updatedAt" FROM centros_custo ORDER BY nome'
    );
    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      nome: String(row.nome),
      createdAt: String(row.createdAt),
      updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    }));
  }

  async findById(id: string): Promise<CentroCusto | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, nome, "createdAt", "updatedAt" FROM centros_custo WHERE id = $1',
      [id]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      nome: String(row.nome),
      createdAt: String(row.createdAt),
      updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    };
  }

  async findByName(nome: string): Promise<CentroCusto | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, nome, "createdAt", "updatedAt" FROM centros_custo WHERE nome = $1',
      [nome]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      nome: String(row.nome),
      createdAt: String(row.createdAt),
      updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    };
  }

  async create(input: CentroCustoInput): Promise<CentroCusto> {
    const pool = getPool();
    const id = randomUUID();
    const now = new Date().toISOString();

    await pool.query(
      'INSERT INTO centros_custo (id, nome, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4)',
      [id, input.nome, now, now]
    );

    return { id, nome: input.nome, createdAt: now, updatedAt: now };
  }

  async update(
    id: string,
    input: Partial<CentroCustoInput>
  ): Promise<CentroCusto | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.nome !== undefined) {
      updates.push(`nome = $${updates.length + 1}`);
      values.push(input.nome);
    }

    if (updates.length === 0) return existing;

    updates.push(`"updatedAt" = $${updates.length + 1}`);
    values.push(new Date().toISOString());
    values.push(id);

    const pool = getPool();
    await pool.query(
      `UPDATE centros_custo SET ${updates.join(", ")} WHERE id = $${values.length}`,
      values
    );

    return await this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query("DELETE FROM centros_custo WHERE id = $1", [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }
}
