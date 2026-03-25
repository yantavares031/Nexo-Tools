import type {
  ISolicitanteRepository,
  SolicitantePaginatedResult,
} from "@/lib/domain/solicitante.repository";
import type { Solicitante, SolicitanteInput } from "@/types/globals";
import { getPool } from "@/lib/infra/db-pg";

function rowToSolicitante(row: Record<string, unknown>): Solicitante {
  const un = row.unResponsavel;
  return {
    id: String(row.id),
    nome: String(row.nome),
    unResponsavel: un == null || un === "" ? undefined : String(un),
  };
}

export class SolicitantePostgresRepository implements ISolicitanteRepository {
  async findAll(): Promise<Solicitante[]> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM solicitantes ORDER BY nome");
    return (result.rows as Record<string, unknown>[]).map(rowToSolicitante);
  }

  async findPaginated(
    filters: { q?: string } | undefined,
    pagination: { page: number; limit: number }
  ): Promise<SolicitantePaginatedResult> {
    const pool = getPool();
    const { page, limit } = pagination;
    const q = filters?.q?.trim();
    const hasSearch = !!q;

    let countQuery: string;
    let dataQuery: string;
    const countParams: unknown[] = [];
    const dataParams: unknown[] = [];

    const like = hasSearch ? `%${q!.replace(/%/g, "\\%").replace(/_/g, "\\_")}%` : null;
    if (hasSearch) {
      countQuery = `SELECT COUNT(*)::int as total FROM solicitantes
        WHERE nome ILIKE $1 OR "unResponsavel" ILIKE $1`;
      countParams.push(like);
      dataQuery = `SELECT * FROM solicitantes
        WHERE nome ILIKE $1 OR "unResponsavel" ILIKE $1
        ORDER BY nome
        LIMIT $2 OFFSET $3`;
      dataParams.push(like);
    } else {
      countQuery = "SELECT COUNT(*)::int as total FROM solicitantes";
      dataQuery = "SELECT * FROM solicitantes ORDER BY nome LIMIT $1 OFFSET $2";
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = (countResult.rows[0] as { total: number }).total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    dataParams.push(limit, offset);
    const dataResult = await pool.query(dataQuery, dataParams);
    const items = (dataResult.rows as Record<string, unknown>[]).map(rowToSolicitante);

    return { items, total, page: pageSafe, limit, totalPages };
  }

  async findById(id: string): Promise<Solicitante | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM solicitantes WHERE id = $1',
      [id]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToSolicitante(row) : null;
  }

  async create(input: SolicitanteInput): Promise<Solicitante> {
    const id = String(Date.now());
    const pool = getPool();
    const un = input.unResponsavel?.trim() ?? "";
    await pool.query(
      'INSERT INTO solicitantes (id, nome, "unResponsavel") VALUES ($1, $2, $3)',
      [id, input.nome, un]
    );
    return { ...input, id, unResponsavel: un || undefined };
  }

  async update(
    id: string,
    input: Partial<Pick<Solicitante, "nome" | "unResponsavel">>
  ): Promise<void> {
    const pool = getPool();
    const updates: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (input.nome !== undefined) {
      updates.push(`nome = $${i++}`);
      params.push(input.nome);
    }
    if (Object.prototype.hasOwnProperty.call(input, "unResponsavel")) {
      updates.push(`"unResponsavel" = $${i++}`);
      params.push(input.unResponsavel?.trim() ?? "");
    }
    if (updates.length === 0) return;
    params.push(id);
    await pool.query(
      `UPDATE solicitantes SET ${updates.join(", ")} WHERE id = $${i}`,
      params
    );
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    await pool.query("DELETE FROM solicitantes WHERE id = $1", [id]);
  }
}
