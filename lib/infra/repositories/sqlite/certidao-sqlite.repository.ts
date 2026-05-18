import type { Certidao, CertidaoInput } from "@/types/globals";
import type {
  ICertidaoRepository,
  CertidaoFilters,
  CertidaoPaginatedResult,
} from "@/lib/domain/certidao.repository";
import { getDb } from "@/DB/db";
import { randomUUID } from "crypto";
import path from "path";
import { deleteStoredUploadFile } from "@/lib/stored-upload";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "certidoes");

function optionalCadastradoPorUserId(row: Record<string, unknown>): string | undefined {
  const v = row.cadastradoPorUserId;
  if (v == null || String(v).trim() === "") return undefined;
  return String(v);
}

function optionalAgenciaId(row: Record<string, unknown>): string | undefined {
  const v = row.agenciaId;
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

  if (filters?.agenciaId) {
    parts.push("agenciaId = ?");
    params.push(filters.agenciaId);
  }

  const mes = (filters?.mes ?? "").trim();
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    parts.push("substr(createdAt, 1, 7) = ?");
    params.push(mes);
  }

  const q = (filters?.q ?? "").trim();
  if (q) {
    parts.push("COALESCE(descricao, '') LIKE ?");
    params.push(`%${q}%`);
  }

  const clause = parts.length > 0 ? `WHERE ${parts.join(" AND ")}` : "";
  return { clause, params };
}

export class CertidaoSqliteRepository implements ICertidaoRepository {
  async findPaginated(
    filters: CertidaoFilters | undefined,
    pagination: { page: number; limit: number }
  ): Promise<CertidaoPaginatedResult> {
    const db = getDb();
    const { page, limit } = pagination;
    const { clause, params } = buildWhere(filters);

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM certidoes ${clause}`)
      .get(...params) as { total: number };
    const total = countRow.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    const rows = db
      .prepare(
        `SELECT * FROM certidoes ${clause}
         ORDER BY createdAt DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Array<Record<string, unknown>>;

    const items = rows.map(rowToCertidao);
    return { items, total, page: pageSafe, limit, totalPages };
  }

  async findById(id: string): Promise<Certidao | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM certidoes WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToCertidao(row) : null;
  }

  async create(input: CertidaoInput): Promise<Certidao> {
    const db = getDb();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO certidoes (id, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, descricao, autor, cadastradoPorUserId, agenciaId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.nomeArquivo,
      input.tipoArquivo,
      input.tamanho,
      input.caminhoArquivo,
      input.descricao || null,
      input.autor,
      input.cadastradoPorUserId?.trim() || null,
      input.agenciaId?.trim() || null,
      createdAt
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
    const db = getDb();
    const certidao = await this.findById(id);
    if (certidao) {
      await deleteStoredUploadFile(certidao.caminhoArquivo, UPLOADS_DIR);
      db.prepare("DELETE FROM certidoes WHERE id = ?").run(id);
    }
  }
}
