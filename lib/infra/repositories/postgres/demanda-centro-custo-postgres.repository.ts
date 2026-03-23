import type { DemandaCentroCusto, DemandaCentroCustoInput } from "@/types/globals";
import type { IDemandaCentroCustoRepository } from "@/lib/domain/demanda-centro-custo.repository";
import { getPool } from "@/lib/infra/db-pg";
import { randomUUID } from "crypto";

function rowToDemandaCentroCusto(row: Record<string, unknown>): DemandaCentroCusto {
  return {
    id: String(row.id),
    demandaId: String(row.demandaId),
    centroDeCusto: String(row.centroDeCusto),
    valor: Number(row.valor),
    ordem: Number(row.ordem),
  };
}

export class DemandaCentroCustoPostgresRepository
  implements IDemandaCentroCustoRepository
{
  async findByDemandaId(demandaId: string): Promise<DemandaCentroCusto[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM demanda_centros_custo WHERE "demandaId" = $1 ORDER BY ordem ASC`,
      [demandaId]
    );
    return (result.rows as Record<string, unknown>[]).map(rowToDemandaCentroCusto);
  }

  async create(input: DemandaCentroCustoInput): Promise<DemandaCentroCusto> {
    const pool = getPool();
    const id = randomUUID();
    await pool.query(
      `INSERT INTO demanda_centros_custo (id, "demandaId", "centroDeCusto", valor, ordem)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, input.demandaId, input.centroDeCusto, input.valor, input.ordem]
    );
    return { ...input, id };
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    const result = await pool.query(
      "DELETE FROM demanda_centros_custo WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) throw new Error("Centro de custo não encontrado");
  }

  async removeByDemandaId(demandaId: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      'DELETE FROM demanda_centros_custo WHERE "demandaId" = $1',
      [demandaId]
    );
  }
}
