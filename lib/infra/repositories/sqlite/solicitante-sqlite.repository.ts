import type {
  ISolicitanteRepository,
  SolicitantePaginatedResult,
} from "@/lib/domain/solicitante.repository";
import type { Solicitante, SolicitanteInput } from "@/types/globals";
import { getDb } from "@/DB/db";

function rowToSolicitante(row: Record<string, unknown>): Solicitante {
  const un = row.unResponsavel;
  return {
    id: String(row.id),
    nome: String(row.nome),
    unResponsavel: un == null || un === "" ? undefined : String(un),
  };
}

export class SolicitanteSqliteRepository implements ISolicitanteRepository {
  async findAll(): Promise<Solicitante[]> {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM solicitantes ORDER BY nome").all() as Record<string, unknown>[];
    return rows.map(rowToSolicitante);
  }

  async findPaginated(
    filters: { q?: string } | undefined,
    pagination: { page: number; limit: number }
  ): Promise<SolicitantePaginatedResult> {
    const db = getDb();
    const { page, limit } = pagination;
    const q = filters?.q?.trim();
    const hasSearch = !!q;
    const like = hasSearch ? `%${q!.replace(/%/g, "\\%").replace(/_/g, "\\_")}%` : null;

    const countRow = hasSearch
      ? (db.prepare("SELECT COUNT(*) as total FROM solicitantes WHERE nome LIKE ? OR unResponsavel LIKE ?").get(like, like) as { total: number })
      : (db.prepare("SELECT COUNT(*) as total FROM solicitantes").get() as { total: number });
    const total = countRow.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    const rows = hasSearch
      ? (db.prepare("SELECT * FROM solicitantes WHERE nome LIKE ? OR unResponsavel LIKE ? ORDER BY nome LIMIT ? OFFSET ?")
          .all(like, like, limit, offset) as Record<string, unknown>[])
      : (db.prepare("SELECT * FROM solicitantes ORDER BY nome LIMIT ? OFFSET ?")
          .all(limit, offset) as Record<string, unknown>[]);

    const items = rows.map(rowToSolicitante);
    return { items, total, page: pageSafe, limit, totalPages };
  }

  async findById(id: string): Promise<Solicitante | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM solicitantes WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? rowToSolicitante(row) : null;
  }

  async create(input: SolicitanteInput): Promise<Solicitante> {
    const id = String(Date.now());
    const db = getDb();
    const un = input.unResponsavel?.trim() ?? "";
    db.prepare(
      "INSERT INTO solicitantes (id, nome, unResponsavel) VALUES (?, ?, ?)"
    ).run(id, input.nome, un);
    return { ...input, id, unResponsavel: un || undefined };
  }

  async update(
    id: string,
    input: Partial<Pick<Solicitante, "nome" | "unResponsavel">>
  ): Promise<void> {
    const db = getDb();
    const updates: string[] = [];
    const params: unknown[] = [];
    if (input.nome !== undefined) {
      updates.push("nome = ?");
      params.push(input.nome);
    }
    if (Object.prototype.hasOwnProperty.call(input, "unResponsavel")) {
      updates.push("unResponsavel = ?");
      params.push(input.unResponsavel?.trim() ?? "");
    }
    if (updates.length === 0) return;
    params.push(id);
    db.prepare(`UPDATE solicitantes SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    db.prepare("DELETE FROM solicitantes WHERE id = ?").run(id);
  }
}
