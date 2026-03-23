import type { DemandaMensagem, DemandaMensagemInput } from "@/types/globals";
import type { IDemandaMensagemRepository } from "@/lib/domain/demanda-mensagem.repository";
import { getDb } from "@/DB/db";
import { randomUUID } from "crypto";

function rowToDemandaMensagem(row: Record<string, unknown>): DemandaMensagem {
  return {
    id: String(row.id),
    demandaId: String(row.demandaId),
    mensagem: String(row.mensagem),
    autor: String(row.autor),
    createdAt: String(row.createdAt),
  };
}

export class DemandaMensagemSqliteRepository implements IDemandaMensagemRepository {
  async findByDemandaId(demandaId: string): Promise<DemandaMensagem[]> {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM demanda_mensagens WHERE demandaId = ? ORDER BY createdAt DESC")
      .all(demandaId) as Array<Record<string, unknown>>;
    return rows.map(rowToDemandaMensagem);
  }

  async create(input: DemandaMensagemInput): Promise<DemandaMensagem> {
    const db = getDb();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      "INSERT INTO demanda_mensagens (id, demandaId, mensagem, autor, createdAt) VALUES (?, ?, ?, ?, ?)"
    ).run(id, input.demandaId, input.mensagem, input.autor, createdAt);

    return {
      id,
      demandaId: input.demandaId,
      mensagem: input.mensagem,
      autor: input.autor,
      createdAt,
    };
  }
}
