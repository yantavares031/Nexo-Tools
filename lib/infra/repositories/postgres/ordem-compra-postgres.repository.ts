import path from "path";
import type { OrdemCompra, OrdemCompraCreateInput, OrdemCompraStatus } from "@/types/globals";
import type {
  IOrdemCompraRepository,
  OrdemCompraAgenciaFilters,
  OrdemCompraListItem,
  OrdemCompraPaginatedResult,
  OrdemCompraRegistrarAssinaturaInput,
} from "@/lib/domain/ordem-compra.repository";
import { getPool } from "@/lib/infra/db-pg";
import { randomUUID } from "crypto";
import { deleteStoredUploadFile } from "@/lib/stored-upload";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "ordens-compra");

function buildDemandaAgenciaWhere(
  filters: Pick<OrdemCompraAgenciaFilters, "agenciaId" | "agenciaNomeLegacy">,
  startIdx: number
): { clause: string; params: unknown[]; nextIdx: number } {
  if (!filters.agenciaId) return { clause: "", params: [], nextIdx: startIdx };
  const legacy = filters.agenciaNomeLegacy?.trim();
  if (legacy) {
    return {
      clause: `(d."agenciaId" = $${startIdx} OR ((d."agenciaId" IS NULL OR TRIM(COALESCE(d."agenciaId", '')) = '') AND d.agencia = $${startIdx + 1}))`,
      params: [filters.agenciaId, legacy],
      nextIdx: startIdx + 2,
    };
  }
  return {
    clause: `d."agenciaId" = $${startIdx}`,
    params: [filters.agenciaId],
    nextIdx: startIdx + 1,
  };
}

function optionalStringPg(row: Record<string, unknown>, key: string): string | undefined {
  const v = row[key];
  if (v == null || String(v).trim() === "") return undefined;
  return String(v);
}

function rowToOrdemCompra(row: Record<string, unknown>): OrdemCompra {
  const tAss = row.tamanhoAssinado;
  return {
    id: String(row.id),
    demandaId: String(row.demandaId),
    nomeArquivo: String(row.nomeArquivo),
    tipoArquivo: String(row.tipoArquivo),
    tamanho: Number(row.tamanho),
    caminhoArquivo: String(row.caminhoArquivo),
    nomeArquivoAssinado: optionalStringPg(row, "nomeArquivoAssinado"),
    tipoArquivoAssinado: optionalStringPg(row, "tipoArquivoAssinado"),
    tamanhoAssinado:
      tAss != null && String(tAss).trim() !== "" ? Number(tAss) : undefined,
    caminhoArquivoAssinado: optionalStringPg(row, "caminhoArquivoAssinado"),
    status: row.status as OrdemCompraStatus,
    autor: String(row.autor),
    enviadoPorEmail: optionalStringPg(row, "enviadoPorEmail"),
    createdAt: String(row.createdAt),
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}

export class OrdemCompraPostgresRepository implements IOrdemCompraRepository {
  async create(input: OrdemCompraCreateInput): Promise<OrdemCompra> {
    const pool = getPool();
    const id = input.id?.trim() || randomUUID();
    const createdAt = new Date().toISOString();
    const status: OrdemCompraStatus = "em_aberto";

    const enviadoPor = input.enviadoPorEmail?.trim() || null;
    await pool.query(
      `INSERT INTO ordens_compra (id, "demandaId", "nomeArquivo", "tipoArquivo", tamanho, "caminhoArquivo", status, autor, "enviadoPorEmail", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        input.demandaId,
        input.nomeArquivo,
        input.tipoArquivo,
        input.tamanho,
        input.caminhoArquivo,
        status,
        input.autor,
        enviadoPor,
        createdAt,
      ]
    );

    return {
      id,
      demandaId: input.demandaId,
      nomeArquivo: input.nomeArquivo,
      tipoArquivo: input.tipoArquivo,
      tamanho: input.tamanho,
      caminhoArquivo: input.caminhoArquivo,
      status,
      autor: input.autor,
      enviadoPorEmail: enviadoPor ?? undefined,
      createdAt,
    };
  }

  async findById(id: string): Promise<OrdemCompra | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM ordens_compra WHERE id = $1", [id]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToOrdemCompra(row) : null;
  }

  async findByDemandaId(demandaId: string): Promise<OrdemCompra[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM ordens_compra WHERE "demandaId" = $1 ORDER BY "createdAt" DESC`,
      [demandaId]
    );
    return (result.rows as Array<Record<string, unknown>>).map((row) => rowToOrdemCompra(row));
  }

  async findDemandaIdsComOrdemCompraAssinada(): Promise<string[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT DISTINCT "demandaId" as id FROM ordens_compra WHERE status = 'assinada'`
    );
    return (result.rows as Array<{ id: string }>).map((r) => String(r.id));
  }

  async findPaginated(
    filters: OrdemCompraAgenciaFilters | undefined,
    pagination: { page: number; limit: number }
  ): Promise<OrdemCompraPaginatedResult> {
    const pool = getPool();
    const { page, limit } = pagination;
    const q = (filters?.q ?? "").trim();
    const qLike = `%${q}%`;
    const status = filters?.status;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.agenciaId) {
      const { clause, params: agParams, nextIdx } = buildDemandaAgenciaWhere(filters, idx);
      conditions.push(clause);
      params.push(...agParams);
      idx = nextIdx;
    }
    if (status) {
      conditions.push(`oc.status = $${idx}`);
      params.push(status);
      idx++;
    }
    if (q) {
      conditions.push(
        `(LOWER(d.demanda) LIKE LOWER($${idx}) OR LOWER(d."ocPi") LIKE LOWER($${idx + 1}) OR LOWER(oc."nomeArquivo") LIKE LOWER($${idx + 2}))`
      );
      params.push(qLike, qLike, qLike);
      idx += 3;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM ordens_compra oc INNER JOIN demandas d ON oc."demandaId" = d.id ${where}`,
      params
    );
    const total = (countResult.rows[0] as { total: number }).total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    const limIdx = params.length + 1;
    const offIdx = params.length + 2;

    const dataResult = await pool.query(
      `SELECT oc.*, d.demanda as "demandaDescricao", d."ocPi" as "demandaOcPi"
       FROM ordens_compra oc
       INNER JOIN demandas d ON oc."demandaId" = d.id
       ${where}
       ORDER BY oc."createdAt" DESC
       LIMIT $${limIdx} OFFSET $${offIdx}`,
      [...params, limit, offset]
    );

    const items = (dataResult.rows as Array<Record<string, unknown>>).map((row) => ({
      ...rowToOrdemCompra(row),
      demandaDescricao: String(row.demandaDescricao ?? ""),
      demandaOcPi: String(row.demandaOcPi ?? "").trim(),
    }));

    return {
      items,
      total,
      page: pageSafe,
      limit,
      totalPages,
    };
  }

  async registrarAssinaturaComArquivo(
    id: string,
    input: OrdemCompraRegistrarAssinaturaInput
  ): Promise<void> {
    const pool = getPool();
    const updatedAt = new Date().toISOString();
    await pool.query(
      `UPDATE ordens_compra SET
        status = 'assinada',
        "nomeArquivoAssinado" = $1,
        "tipoArquivoAssinado" = $2,
        "tamanhoAssinado" = $3,
        "caminhoArquivoAssinado" = $4,
        "updatedAt" = $5
       WHERE id = $6`,
      [
        input.nomeArquivoAssinado,
        input.tipoArquivoAssinado,
        input.tamanhoAssinado,
        input.caminhoArquivoAssinado,
        updatedAt,
        id,
      ]
    );
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    const oc = await this.findById(id);
    if (!oc) return;
    await deleteStoredUploadFile(oc.caminhoArquivo, UPLOADS_DIR);
    if (oc.caminhoArquivoAssinado) {
      await deleteStoredUploadFile(oc.caminhoArquivoAssinado, UPLOADS_DIR);
    }
    await pool.query("DELETE FROM ordens_compra WHERE id = $1", [id]);
  }
}
