import type {
  DemandaMensagem,
  DemandaMensagemInput,
} from "@/types/globals";
import type { IDemandaMensagemRepository } from "@/lib/domain/demanda-mensagem.repository";
import { getPool } from "@/lib/infra/db-pg";
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

export class DemandaMensagemPostgresRepository
  implements IDemandaMensagemRepository
{
  async findByDemandaId(demandaId: string): Promise<DemandaMensagem[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM demanda_mensagens WHERE "demandaId" = $1 ORDER BY "createdAt" DESC`,
      [demandaId]
    );
    return (result.rows as Record<string, unknown>[]).map(rowToDemandaMensagem);
  }

  async create(input: DemandaMensagemInput): Promise<DemandaMensagem> {
    const pool = getPool();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO demanda_mensagens (id, "demandaId", mensagem, autor, "createdAt") VALUES ($1, $2, $3, $4, $5)`,
      [id, input.demandaId, input.mensagem, input.autor, createdAt]
    );

    return {
      id,
      demandaId: input.demandaId,
      mensagem: input.mensagem,
      autor: input.autor,
      createdAt,
    };
  }
}
