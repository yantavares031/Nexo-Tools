import type { DemandaHistorico, DemandaHistoricoInput } from "@/types/globals";
import type { IDemandaHistoricoRepository } from "@/lib/domain/demanda-historico.repository";
import { parseHistoricoAlteracoes } from "@/lib/infra/repositories/demanda-historico-row";
import { getDb } from "@/DB/db";
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

export class DemandaHistoricoSqliteRepository implements IDemandaHistoricoRepository {
  async findByDemandaId(demandaId: string): Promise<DemandaHistorico[]> {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM demanda_historico WHERE demandaId = ? ORDER BY createdAt DESC")
      .all(demandaId) as Array<Record<string, unknown>>;
    return rows.map(rowToHistorico);
  }

  async create(input: DemandaHistoricoInput): Promise<DemandaHistorico> {
    const db = getDb();
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO demanda_historico (id, demandaId, tipo, descricao, alteracoes, autor, autorUserId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.demandaId,
      input.tipo,
      input.descricao,
      JSON.stringify(input.alteracoes),
      input.autor,
      input.autorUserId ?? null,
      createdAt
    );
    return { ...input, id, createdAt };
  }
}
