import type { Demanda } from "@/types/globals";
import type {
  IDemandaRepository,
  DemandaFilters,
  DemandaFilterOptions,
  DemandaPagination,
  DemandaPaginatedResult,
} from "@/lib/domain/demanda.repository";
import type { DemandaInput } from "@/types/globals";
import { getPool } from "@/lib/infra/db-pg";

function rowToDemanda(row: Record<string, unknown>): Demanda {
  return {
    id: String(row.id),
    demanda: String(row.demanda),
    solicitante: String(row.solicitante),
    unResponsavel: String(row.unResponsavel),
    obs: String(row.obs ?? ""),
    status: row.status as Demanda["status"],
    valor: Number(row.valor),
    centroDeCusto: String(row.centroDeCusto ?? ""),
    ocPi: String(row.ocPi ?? ""),
    mes: String(row.mes ?? ""),
    agencia: row.agencia ? String(row.agencia) : undefined,
    agenciaId: row.agenciaId ? String(row.agenciaId) : undefined,
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}

function buildWhereAndParams(
  filters?: DemandaFilters
): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(`(LOWER(demanda) LIKE $${idx} OR LOWER("ocPi") LIKE $${idx + 1})`);
    params.push(term, term);
    idx += 2;
  }
  if (filters?.solicitante) {
    conditions.push(`solicitante = $${idx}`);
    params.push(filters.solicitante);
    idx++;
  }
  if (filters?.unResponsavel) {
    conditions.push(`"unResponsavel" = $${idx}`);
    params.push(filters.unResponsavel);
    idx++;
  }
  if (filters?.status) {
    conditions.push(`status = $${idx}`);
    params.push(filters.status);
    idx++;
  } else if (filters?.statusIn && filters.statusIn.length > 0) {
    const placeholders = filters.statusIn.map((_, i) => `$${idx + i}`).join(",");
    conditions.push(`status IN (${placeholders})`);
    params.push(...filters.statusIn);
    idx += filters.statusIn.length;
  }
  if (filters?.agencia) {
    conditions.push(`agencia = $${idx}`);
    params.push(filters.agencia);
    idx++;
  }
  if (filters?.mes?.trim()) {
    conditions.push(`mes = $${idx}`);
    params.push(filters.mes.trim());
    idx++;
  }
  if (filters?.comprovacao === "comprovado") {
    conditions.push(
      "EXISTS (SELECT 1 FROM comprovacao_demandas cd WHERE cd.demanda_id = demandas.id)"
    );
  }
  if (filters?.comprovacao === "nao_comprovado") {
    conditions.push(
      "NOT EXISTS (SELECT 1 FROM comprovacao_demandas cd WHERE cd.demanda_id = demandas.id)"
    );
  }
  if (filters?.agenciaId) {
    conditions.push(`"agenciaId" = $${idx}`);
    params.push(filters.agenciaId);
    idx++;
  }
  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  return { where, params };
}

export class DemandaPostgresRepository implements IDemandaRepository {
  async findAll(filters?: DemandaFilters): Promise<Demanda[]> {
    const pool = getPool();
    const { where, params } = buildWhereAndParams(filters);
    const result = await pool.query(
      `SELECT * FROM demandas ${where} ORDER BY "updatedAt" DESC NULLS LAST, "createdAt" DESC NULLS LAST`,
      params
    );
    return (result.rows as Record<string, unknown>[]).map(rowToDemanda);
  }

  async findPaginated(
    filters: DemandaFilters | undefined,
    pagination: DemandaPagination
  ): Promise<DemandaPaginatedResult> {
    const pool = getPool();
    const { where, params } = buildWhereAndParams(filters);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM demandas ${where}`,
      params
    );
    const total = countResult.rows[0]?.total ?? 0;
    const { page, limit } = pagination;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;
    const result = await pool.query(
      `SELECT * FROM demandas ${where} ORDER BY "updatedAt" DESC NULLS LAST, "createdAt" DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return {
      items: (result.rows as Record<string, unknown>[]).map(rowToDemanda),
      total,
      page: pageSafe,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<Demanda | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM demandas WHERE id = $1", [id]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToDemanda(row) : null;
  }

  async getFilterOptions(filters?: DemandaFilters): Promise<DemandaFilterOptions> {
    const pool = getPool();
    const { where, params } = buildWhereAndParams(filters);
    const baseQuery = `SELECT DISTINCT solicitante, "unResponsavel", status FROM demandas ${where}`;
    const result = await pool.query(baseQuery, params);
    const rows = result.rows as Array<{
      solicitante: string;
      unResponsavel: string;
      status: string;
    }>;
    const solicitantes = [...new Set(rows.map((r) => r.solicitante))].sort();
    const statuses = [...new Set(rows.map((r) => r.status))].sort();

    const unidadesResult = await pool.query("SELECT nome FROM unidades ORDER BY nome");
    const unidadesRows = unidadesResult.rows as { nome: string }[];
    const unResponsaveis =
      unidadesRows.length > 0
        ? unidadesRows.map((r) => r.nome)
        : [...new Set(rows.map((r) => r.unResponsavel))].sort();

    return {
      solicitantes,
      solicitantesComUnidade: [],
      unResponsaveis,
      statuses,
      agencias: [],
    };
  }

  async create(input: DemandaInput): Promise<Demanda> {
    const id = String(Date.now());
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.query(
      `INSERT INTO demandas (
        id, demanda, solicitante, "unResponsavel", obs, status, valor,
        "centroDeCusto", "ocPi", mes, agencia, "agenciaId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        input.demanda,
        input.solicitante,
        input.unResponsavel,
        input.obs ?? "",
        input.status,
        input.valor,
        input.centroDeCusto ?? "",
        input.ocPi ?? "",
        input.mes ?? "",
        input.agencia ?? null,
        input.agenciaId ?? null,
        now,
        now,
      ]
    );
    return { ...input, id, createdAt: now, updatedAt: now };
  }

  async update(id: string, input: DemandaInput): Promise<Demanda> {
    const pool = getPool();
    const currentResult = await pool.query("SELECT * FROM demandas WHERE id = $1", [
      id,
    ]);
    const current = currentResult.rows[0] as Record<string, unknown> | undefined;
    if (!current) throw new Error("Demanda não encontrada");
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE demandas SET
        demanda = $1, solicitante = $2, "unResponsavel" = $3, obs = $4, status = $5,
        valor = $6, "centroDeCusto" = $7, "ocPi" = $8, mes = $9,
        agencia = $10, "agenciaId" = $11, "updatedAt" = $12
      WHERE id = $13`,
      [
        input.demanda,
        input.solicitante,
        input.unResponsavel,
        input.obs ?? "",
        input.status,
        input.valor,
        input.centroDeCusto ?? "",
        input.ocPi ?? "",
        input.mes ?? "",
        input.agencia ?? null,
        input.agenciaId ?? null,
        now,
        id,
      ]
    );
    return {
      ...input,
      id,
      createdAt: String(current.createdAt ?? now),
      updatedAt: now,
    };
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    const result = await pool.query("DELETE FROM demandas WHERE id = $1 RETURNING id", [
      id,
    ]);
    if (result.rowCount === 0) throw new Error("Demanda não encontrada");
  }
}
