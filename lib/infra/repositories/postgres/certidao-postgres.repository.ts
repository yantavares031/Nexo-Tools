import type { Certidao, CertidaoInput } from "@/types/globals";
import type {
  ICertidaoRepository,
  CertidaoFilters,
  CertidaoPaginatedResult,
} from "@/lib/domain/certidao.repository";
import { getPool } from "@/lib/infra/db-pg";
import { randomUUID } from "crypto";
import path from "path";
import { deleteStoredUploadFile } from "@/lib/stored-upload";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "certidoes");

function optionalCadastradoPorUserId(row: Record<string, unknown>): string | undefined {
  const v = row.cadastradoPorUserId ?? row.cadastroporuserid;
  if (v == null || String(v).trim() === "") return undefined;
  return String(v);
}

function optionalAgenciaId(row: Record<string, unknown>): string | undefined {
  const v = row.agenciaId ?? row.agenciaid;
  if (v == null || String(v).trim() === "") return undefined;
  return String(v);
}

function rowToCertidao(row: Record<string, unknown>): Certidao {
  return {
    id: String(row.id),
    nomeArquivo: String(row.nomeArquivo),
    tipoArquivo: String(row.tipoArquivo),
    tamanho: Number(row.tamanho),
    caminhoArquivo: String(row.caminhoArquivo),
    descricao: row.descricao ? String(row.descricao) : undefined,
    autor: String(row.autor),
    cadastradoPorUserId: optionalCadastradoPorUserId(row),
    agenciaId: optionalAgenciaId(row),
    createdAt: String(row.createdAt),
  };
}

function buildWhere(filters: CertidaoFilters | undefined): {
  clause: string;
  params: unknown[];
} {
  const parts: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.agenciaId) {
    parts.push(`"agenciaId" = $${idx}`);
    params.push(filters.agenciaId);
    idx++;
  }

  const mes = (filters?.mes ?? "").trim();
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    parts.push(`SUBSTRING("createdAt", 1, 7) = $${idx}`);
    params.push(mes);
    idx++;
  }

  const q = (filters?.q ?? "").trim();
  if (q) {
    parts.push(`COALESCE(descricao, '') ILIKE $${idx}`);
    params.push(`%${q}%`);
  }

  const clause = parts.length > 0 ? `WHERE ${parts.join(" AND ")}` : "";
  return { clause, params };
}

export class CertidaoPostgresRepository implements ICertidaoRepository {
  async findPaginated(
    filters: CertidaoFilters | undefined,
    pagination: { page: number; limit: number }
  ): Promise<CertidaoPaginatedResult> {
    const pool = getPool();
    const { page, limit } = pagination;
    const { clause, params } = buildWhere(filters);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM certidoes ${clause}`,
      params
    );
    const total = (countResult.rows[0] as { total: number }).total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    const limIdx = params.length + 1;
    const offIdx = params.length + 2;
    const dataResult = await pool.query(
      `SELECT * FROM certidoes ${clause}
       ORDER BY "createdAt" DESC
       LIMIT $${limIdx} OFFSET $${offIdx}`,
      [...params, limit, offset]
    );

    const items = (dataResult.rows as Array<Record<string, unknown>>).map(rowToCertidao);
    return { items, total, page: pageSafe, limit, totalPages };
  }

  async findById(id: string): Promise<Certidao | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM certidoes WHERE id = $1", [id]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToCertidao(row) : null;
  }

  async create(input: CertidaoInput): Promise<Certidao> {
    const pool = getPool();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO certidoes (id, "nomeArquivo", "tipoArquivo", tamanho, "caminhoArquivo", descricao, autor, "cadastradoPorUserId", "agenciaId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        input.nomeArquivo,
        input.tipoArquivo,
        input.tamanho,
        input.caminhoArquivo,
        input.descricao || null,
        input.autor,
        input.cadastradoPorUserId?.trim() || null,
        input.agenciaId?.trim() || null,
        createdAt,
      ]
    );

    return {
      id,
      nomeArquivo: input.nomeArquivo,
      tipoArquivo: input.tipoArquivo,
      tamanho: input.tamanho,
      caminhoArquivo: input.caminhoArquivo,
      descricao: input.descricao,
      autor: input.autor,
      cadastradoPorUserId: input.cadastradoPorUserId?.trim() || undefined,
      agenciaId: input.agenciaId?.trim() || undefined,
      createdAt,
    };
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    const certidao = await this.findById(id);
    if (certidao) {
      await deleteStoredUploadFile(certidao.caminhoArquivo, UPLOADS_DIR);
      await pool.query("DELETE FROM certidoes WHERE id = $1", [id]);
    }
  }
}
