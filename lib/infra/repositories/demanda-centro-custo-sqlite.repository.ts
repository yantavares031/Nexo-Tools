import type { DemandaCentroCusto, DemandaCentroCustoInput } from "@/types/globals";
import type { IDemandaCentroCustoRepository } from "@/lib/domain/demanda-centro-custo.repository";
import { getDb } from "@/DB/db";
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

export class DemandaCentroCustoSqliteRepository implements IDemandaCentroCustoRepository {
  async findByDemandaId(demandaId: string): Promise<DemandaCentroCusto[]> {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT * FROM demanda_centros_custo WHERE demandaId = ? ORDER BY ordem ASC`
      )
      .all(demandaId) as Record<string, unknown>[];
    return rows.map(rowToDemandaCentroCusto);
  }

  async create(input: DemandaCentroCustoInput): Promise<DemandaCentroCusto> {
    const db = getDb();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO demanda_centros_custo (id, demandaId, centroDeCusto, valor, ordem)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.demandaId, input.centroDeCusto, input.valor, input.ordem);
    return { ...input, id };
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    const result = db.prepare("DELETE FROM demanda_centros_custo WHERE id = ?").run(id);
    if (result.changes === 0) throw new Error("Centro de custo não encontrado");
  }

  async removeByDemandaId(demandaId: string): Promise<void> {
    const db = getDb();
    db.prepare("DELETE FROM demanda_centros_custo WHERE demandaId = ?").run(demandaId);
  }
}
