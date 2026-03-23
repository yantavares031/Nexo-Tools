import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { Solicitante, SolicitanteInput } from "@/types/globals";
import { getDb } from "@/DB/db";

function rowToSolicitante(row: Record<string, unknown>): Solicitante {
  return {
    id: String(row.id),
    nome: String(row.nome),
    unResponsavel: String(row.unResponsavel),
  };
}

export class SolicitanteSqliteRepository implements ISolicitanteRepository {
  async findAll(): Promise<Solicitante[]> {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM solicitantes ORDER BY nome").all() as Record<string, unknown>[];
    return rows.map(rowToSolicitante);
  }

  async create(input: SolicitanteInput): Promise<Solicitante> {
    const id = String(Date.now());
    const db = getDb();
    db.prepare(
      "INSERT INTO solicitantes (id, nome, unResponsavel) VALUES (?, ?, ?)"
    ).run(id, input.nome, input.unResponsavel);
    return { ...input, id };
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    db.prepare("DELETE FROM solicitantes WHERE id = ?").run(id);
  }
}
