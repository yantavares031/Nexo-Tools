import path from "path";
import type { OrdemCompra, OrdemCompraCreateInput, OrdemCompraStatus } from "@/types/globals";
import type {
  IOrdemCompraRepository,
  OrdemCompraAgenciaFilters,
  OrdemCompraListItem,
  OrdemCompraPaginatedResult,
  OrdemCompraRegistrarAssinaturaInput,
} from "@/lib/domain/ordem-compra.repository";
import { getDb } from "@/DB/db";
import { randomUUID } from "crypto";
import { deleteStoredUploadFile } from "@/lib/stored-upload";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "ordens-compra");

function demandaAgenciaWhereSql(
  filters: Pick<OrdemCompraAgenciaFilters, "agenciaId" | "agenciaNomeLegacy">
): { clause: string; params: unknown[] } {
  if (!filters.agenciaId) return { clause: "", params: [] };
  const legacy = filters.agenciaNomeLegacy?.trim();
  if (legacy) {
    return {
      clause:
        "(d.agenciaId = ? OR ((d.agenciaId IS NULL OR TRIM(COALESCE(d.agenciaId, '')) = '') AND d.agencia = ?))",
      params: [filters.agenciaId, legacy],
    };
  }
  return { clause: "d.agenciaId = ?", params: [filters.agenciaId] };
}

function optionalString(row: Record<string, unknown>, key: string): string | undefined {
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
    nomeArquivoAssinado: optionalString(row, "nomeArquivoAssinado"),
    tipoArquivoAssinado: optionalString(row, "tipoArquivoAssinado"),
    tamanhoAssinado:
      tAss != null && String(tAss).trim() !== "" ? Number(tAss) : undefined,
    caminhoArquivoAssinado: optionalString(row, "caminhoArquivoAssinado"),
    status: row.status as OrdemCompraStatus,
    autor: String(row.autor),
    createdAt: String(row.createdAt),
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}

export class OrdemCompraSqliteRepository implements IOrdemCompraRepository {
  async create(input: OrdemCompraCreateInput): Promise<OrdemCompra> {
    const db = getDb();
    const id = input.id?.trim() || randomUUID();
    const createdAt = new Date().toISOString();
    const status: OrdemCompraStatus = "em_aberto";

    db.prepare(
      `INSERT INTO ordens_compra (id, demandaId, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, status, autor, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.demandaId,
      input.nomeArquivo,
      input.tipoArquivo,
      input.tamanho,
      input.caminhoArquivo,
      status,
      input.autor,
      createdAt
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
      createdAt,
    };
  }

  async findById(id: string): Promise<OrdemCompra | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM ordens_compra WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToOrdemCompra(row) : null;
  }

  async findByDemandaId(demandaId: string): Promise<OrdemCompra[]> {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT * FROM ordens_compra WHERE demandaId = ? ORDER BY datetime(createdAt) DESC"
      )
      .all(demandaId) as Array<Record<string, unknown>>;
    return rows.map((row) => rowToOrdemCompra(row));
  }

  async findDemandaIdsComOrdemCompraAssinada(): Promise<string[]> {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT DISTINCT demandaId FROM ordens_compra WHERE status = 'assinada'"
      )
      .all() as Array<{ demandaId: string }>;
    return rows.map((r) => String(r.demandaId));
  }

  async findPaginated(
    filters: OrdemCompraAgenciaFilters | undefined,
    pagination: { page: number; limit: number }
  ): Promise<OrdemCompraPaginatedResult> {
    const db = getDb();
    const { page, limit } = pagination;
    const q = (filters?.q ?? "").trim();
    const qLike = `%${q}%`;
    const status = filters?.status;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.agenciaId) {
      const { clause, params: agParams } = demandaAgenciaWhereSql(filters);
      conditions.push(clause);
      params.push(...agParams);
    }
    if (status) {
      conditions.push("oc.status = ?");
      params.push(status);
    }
    if (q) {
      conditions.push("(d.demanda LIKE ? OR d.ocPi LIKE ? OR oc.nomeArquivo LIKE ?)");
      params.push(qLike, qLike, qLike);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const baseFrom = `FROM ordens_compra oc INNER JOIN demandas d ON oc.demandaId = d.id ${where}`;

    const countRow = db.prepare(`SELECT COUNT(*) as total ${baseFrom}`).get(...params) as {
      total: number;
    };
    const total = countRow.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    const rows = db
      .prepare(
        `SELECT oc.*, d.demanda as demandaDescricao, d.ocPi as demandaOcPi ${baseFrom} ORDER BY oc.createdAt DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Array<Record<string, unknown>>;

    const items: OrdemCompraListItem[] = rows.map((row) => ({
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
    const db = getDb();
    const updatedAt = new Date().toISOString();
    db.prepare(
      `UPDATE ordens_compra SET
        status = 'assinada',
        nomeArquivoAssinado = ?,
        tipoArquivoAssinado = ?,
        tamanhoAssinado = ?,
        caminhoArquivoAssinado = ?,
        updatedAt = ?
       WHERE id = ?`
    ).run(
      input.nomeArquivoAssinado,
      input.tipoArquivoAssinado,
      input.tamanhoAssinado,
      input.caminhoArquivoAssinado,
      updatedAt,
      id
    );
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    const oc = await this.findById(id);
    if (!oc) return;
    await deleteStoredUploadFile(oc.caminhoArquivo, UPLOADS_DIR);
    if (oc.caminhoArquivoAssinado) {
      await deleteStoredUploadFile(oc.caminhoArquivoAssinado, UPLOADS_DIR);
    }
    db.prepare("DELETE FROM ordens_compra WHERE id = ?").run(id);
  }
}
