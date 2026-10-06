import type { DemandaHistorico, DemandaHistoricoInput } from "@/types/globals";
import type { IDemandaHistoricoRepository } from "@/lib/domain/demanda-historico.repository";
import { parseHistoricoAlteracoes } from "@/lib/infra/repositories/demanda-historico-row";
import { getPool } from "@/lib/infra/db-pg";
import { randomUUID } from "crypto";

function rowToHistorico(row: Record<string, unknown>): DemandaHistorico {
  return {
    id: String(row.id),
    demandaId: String(row.demandaId),
    tipo: String(row.tipo) as DemandaHistorico["tipo"],
    descricao: String(row.descricao ?? ""),
    alteracoes: parseHistoricoAlteracoes(row.alteracoes),
    autor: String(row.autor ?? ""),
    autorUserId: row.autorUserId ? String(row.autorUserId) : null,
    createdAt: String(row.createdAt),
  };
}

export class DemandaHistoricoPostgresRepository implements IDemandaHistoricoRepository {
  async findByDemandaId(demandaId: string): Promise<DemandaHistorico[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM demanda_historico WHERE "demandaId" = $1 ORDER BY "createdAt" DESC`,
      [demandaId]
    );
    return (result.rows as Record<string, unknown>[]).map(rowToHistorico);
  }

  async create(input: DemandaHistoricoInput): Promise<DemandaHistorico> {
    const pool = getPool();
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await pool.query(
      `INSERT INTO demanda_historico (id, "demandaId", tipo, descricao, alteracoes, autor, "autorUserId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        input.demandaId,
        input.tipo,
        input.descricao,
        JSON.stringify(input.alteracoes),
        input.autor,
        input.autorUserId ?? null,
        createdAt,
      ]
    );
    return { ...input, id, createdAt };
  }
}
