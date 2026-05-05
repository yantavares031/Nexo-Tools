import type { Demanda } from "@/types/globals";
import type {
  IDemandaRepository,
  DemandaFilters,
  DemandaFilterOptions,
  DemandaPagination,
  DemandaPaginatedResult,
} from "@/lib/domain/demanda.repository";
import type { DemandaInput } from "@/types/globals";
import { getDb } from "@/DB/db";

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

function buildWhereAndParams(filters?: DemandaFilters): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push("(LOWER(demanda) LIKE ? OR LOWER(ocPi) LIKE ?)");
    params.push(term, term);
  }
  if (filters?.solicitante) {
    conditions.push("solicitante = ?");
    params.push(filters.solicitante);
  }
  if (filters?.unResponsavel) {
    conditions.push("unResponsavel = ?");
    params.push(filters.unResponsavel);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  } else if (filters?.statusIn && filters.statusIn.length > 0) {
    const placeholders = filters.statusIn.map(() => "?").join(",");
    conditions.push(`status IN (${placeholders})`);
    params.push(...filters.statusIn);
  }
  if (filters?.agencia) {
    conditions.push("agencia = ?");
    params.push(filters.agencia);
  }
  if (filters?.mes?.trim()) {
    conditions.push("mes = ?");
    params.push(filters.mes.trim());
  }
  if (filters?.comprovacao === "comprovado") {
    conditions.push("EXISTS (SELECT 1 FROM comprovacao_demandas cd WHERE cd.demanda_id = demandas.id)");
  }
  if (filters?.comprovacao === "nao_comprovado") {
    conditions.push("NOT EXISTS (SELECT 1 FROM comprovacao_demandas cd WHERE cd.demanda_id = demandas.id)");
  }
  if (filters?.agenciaId && filters?.agenciaNomeLegacy?.trim()) {
    conditions.push(
      "(agenciaId = ? OR ((agenciaId IS NULL OR TRIM(COALESCE(agenciaId, '')) = '') AND agencia = ?))"
    );
    params.push(filters.agenciaId, filters.agenciaNomeLegacy.trim());
  } else if (filters?.agenciaId) {
    conditions.push("agenciaId = ?");
    params.push(filters.agenciaId);
  }
  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  return { where, params };
}

const OCPI_EXISTING_BATCH = 400;

export class DemandaSqliteRepository implements IDemandaRepository {
  async findExistingOcPiKeysAmong(candidatesNormalized: string[]): Promise<Set<string>> {
    const unique = [...new Set(candidatesNormalized.map((s) => s.trim()).filter(Boolean))];
    if (unique.length === 0) return new Set();

    const db = getDb();
    const out = new Set<string>();
    for (let i = 0; i < unique.length; i += OCPI_EXISTING_BATCH) {
      const batch = unique.slice(i, i + OCPI_EXISTING_BATCH);
      const placeholders = batch.map(() => "?").join(",");
      const rows = db
        .prepare(
          `SELECT DISTINCT UPPER(TRIM(ocPi)) AS k FROM demandas
           WHERE TRIM(COALESCE(ocPi, '')) != '' AND UPPER(TRIM(ocPi)) IN (${placeholders})`
        )
        .all(...batch) as { k: string }[];
      for (const r of rows) out.add(String(r.k));
    }
    return out;
  }

  async findAll(filters?: DemandaFilters): Promise<Demanda[]> {
    const db = getDb();
    const { where, params } = buildWhereAndParams(filters);
    const rows = db.prepare(`SELECT * FROM demandas ${where} ORDER BY updatedAt DESC, createdAt DESC`).all(...params) as Record<string, unknown>[];
    return rows.map(rowToDemanda);
  }

  async findPaginated(
    filters: DemandaFilters | undefined,
    pagination: DemandaPagination
  ): Promise<DemandaPaginatedResult> {
    const db = getDb();
    const { where, params } = buildWhereAndParams(filters);
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM demandas ${where}`).get(...params) as { total: number };
    const total = countRow.total;
    const { page, limit } = pagination;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;
    const rows = db.prepare(
      `SELECT * FROM demandas ${where} ORDER BY updatedAt DESC, createdAt DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as Record<string, unknown>[];

    return {
      items: rows.map(rowToDemanda),
      total,
      page: pageSafe,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<Demanda | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM demandas WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? rowToDemanda(row) : null;
  }

  async getFilterOptions(filters?: DemandaFilters): Promise<DemandaFilterOptions> {
    const db = getDb();
    const { where, params } = buildWhereAndParams(filters);
    const baseQuery = `SELECT DISTINCT solicitante, unResponsavel, status FROM demandas ${where}`;
    const rows = db.prepare(baseQuery).all(...params) as Array<{ solicitante: string; unResponsavel: string; status: string }>;
    const solicitantes = [...new Set(rows.map((r) => r.solicitante))].sort();
    const statuses = [...new Set(rows.map((r) => r.status))].sort();

    const unidadesRows = db.prepare("SELECT nome FROM unidades ORDER BY nome").all() as { nome: string }[];
    const unResponsaveis = unidadesRows.length > 0
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
    const db = getDb();
    db.prepare(
      `INSERT INTO demandas (
        id, demanda, solicitante, unResponsavel, obs, status, valor,
        centroDeCusto, ocPi, mes, agencia, agenciaId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
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
      now
    );
    return {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, input: DemandaInput): Promise<Demanda> {
    const db = getDb();
    const current = db.prepare("SELECT * FROM demandas WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!current) throw new Error("Demanda não encontrada");
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE demandas SET
        demanda = ?, solicitante = ?, unResponsavel = ?, obs = ?, status = ?,
        valor = ?, centroDeCusto = ?, ocPi = ?, mes = ?,
        agencia = ?, agenciaId = ?, updatedAt = ?
      WHERE id = ?`
    ).run(
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
      id
    );
    return {
      ...input,
      id,
      createdAt: String(current.createdAt ?? now),
      updatedAt: now,
    };
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    const result = db.prepare("DELETE FROM demandas WHERE id = ?").run(id);
    if (result.changes === 0) throw new Error("Demanda não encontrada");
  }
}
