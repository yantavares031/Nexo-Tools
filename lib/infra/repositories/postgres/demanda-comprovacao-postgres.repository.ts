import type { Comprovacao, ComprovacaoInput } from "@/types/globals";
import type {
  IDemandaComprovacaoRepository,
  ComprovacaoListItem,
  ComprovacaoPaginatedResult,
} from "@/lib/domain/demanda-comprovacao.repository";
import { getPool } from "@/lib/infra/db-pg";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "comprovacoes");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function rowToComprovacao(row: Record<string, unknown>): Comprovacao {
  return {
    id: String(row.id),
    nomeArquivo: String(row.nomeArquivo),
    tipoArquivo: String(row.tipoArquivo),
    tamanho: Number(row.tamanho),
    caminhoArquivo: String(row.caminhoArquivo),
    descricao: row.descricao ? String(row.descricao) : undefined,
    autor: String(row.autor),
    createdAt: String(row.createdAt),
  };
}

export class DemandaComprovacaoPostgresRepository
  implements IDemandaComprovacaoRepository
{
  async findAll(filters?: { agenciaId?: string; q?: string }): Promise<ComprovacaoListItem[]> {
    const pool = getPool();
    const q = (filters?.q ?? "").trim();
    const qLike = `%${q}%`;
    let query: string;
    let params: unknown[] | undefined;
    if (filters?.agenciaId) {
      query = `SELECT c.*, 
        (SELECT COUNT(*)::int FROM comprovacao_demandas cd2 WHERE cd2.comprovacao_id = c.id) as "demandaCount"
        FROM comprovacoes c
        INNER JOIN comprovacao_demandas cd ON c.id = cd.comprovacao_id
        INNER JOIN demandas d ON cd.demanda_id = d.id
        WHERE d."agenciaId" = $1
        ${q ? 'AND COALESCE(c.descricao, \'\') ILIKE $2' : ""}
        GROUP BY c.id
        ORDER BY c."createdAt" DESC`;
      params = q ? [filters.agenciaId, qLike] : [filters.agenciaId];
    } else {
      query = `SELECT c.*, 
        (SELECT COUNT(*)::int FROM comprovacao_demandas cd WHERE cd.comprovacao_id = c.id) as "demandaCount"
        FROM comprovacoes c
        ${q ? 'WHERE COALESCE(c.descricao, \'\') ILIKE $1' : ""}
        ORDER BY c."createdAt" DESC`;
      params = q ? [qLike] : undefined;
    }
    const result = await pool.query(query, params);
    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      ...rowToComprovacao(row),
      demandaCount: Number(row.demandaCount ?? 0),
    }));
  }

  async findPaginated(
    filters: { agenciaId?: string; q?: string } | undefined,
    pagination: { page: number; limit: number }
  ): Promise<ComprovacaoPaginatedResult> {
    const pool = getPool();
    const { page, limit } = pagination;
    const q = (filters?.q ?? "").trim();
    const qLike = `%${q}%`;

    if (filters?.agenciaId) {
      const where = `WHERE d."agenciaId" = $1 ${q ? 'AND COALESCE(c.descricao, \'\') ILIKE $2' : ""}`;
      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT c.id)::int as total FROM comprovacoes c
         INNER JOIN comprovacao_demandas cd ON c.id = cd.comprovacao_id
         INNER JOIN demandas d ON cd.demanda_id = d.id
         ${where}`,
        q ? [filters.agenciaId, qLike] : [filters.agenciaId]
      );
      const total = (countResult.rows[0] as { total: number }).total;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const pageSafe = Math.max(1, Math.min(page, totalPages));
      const offset = (pageSafe - 1) * limit;

      const dataResult = await pool.query(
        `SELECT c.*, 
          (SELECT COUNT(*)::int FROM comprovacao_demandas cd2 WHERE cd2.comprovacao_id = c.id) as "demandaCount"
          FROM comprovacoes c
          INNER JOIN comprovacao_demandas cd ON c.id = cd.comprovacao_id
          INNER JOIN demandas d ON cd.demanda_id = d.id
          ${where}
          GROUP BY c.id
          ORDER BY c."createdAt" DESC
          LIMIT $${q ? 3 : 2} OFFSET $${q ? 4 : 3}`,
        q ? [filters.agenciaId, qLike, limit, offset] : [filters.agenciaId, limit, offset]
      );
      const items = (dataResult.rows as Array<Record<string, unknown>>).map((row) => ({
        ...rowToComprovacao(row),
        demandaCount: Number(row.demandaCount ?? 0),
      }));
      return { items, total, page: pageSafe, limit, totalPages };
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM comprovacoes c ${q ? 'WHERE COALESCE(c.descricao, \'\') ILIKE $1' : ""}`,
      q ? [qLike] : undefined
    );
    const total = (countResult.rows[0] as { total: number }).total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    const dataResult = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*)::int FROM comprovacao_demandas cd WHERE cd.comprovacao_id = c.id) as "demandaCount"
        FROM comprovacoes c
        ${q ? 'WHERE COALESCE(c.descricao, \'\') ILIKE $1' : ""}
        ORDER BY c."createdAt" DESC
        LIMIT $${q ? 2 : 1} OFFSET $${q ? 3 : 2}`,
      q ? [qLike, limit, offset] : [limit, offset]
    );
    const items = (dataResult.rows as Array<Record<string, unknown>>).map((row) => ({
      ...rowToComprovacao(row),
      demandaCount: Number(row.demandaCount ?? 0),
    }));
    return { items, total, page: pageSafe, limit, totalPages };
  }

  async findDemandaIdsByComprovacaoId(comprovacaoId: string): Promise<string[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT demanda_id as "demandaId" FROM comprovacao_demandas WHERE comprovacao_id = $1',
      [comprovacaoId]
    );
    return (result.rows as Array<{ demandaId: string }>).map((r) => r.demandaId);
  }

  async findByDemandaId(demandaId: string): Promise<Comprovacao[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT c.* FROM comprovacoes c
       INNER JOIN comprovacao_demandas cd ON c.id = cd.comprovacao_id
       WHERE cd.demanda_id = $1
       ORDER BY c."createdAt" DESC`,
      [demandaId]
    );
    return (result.rows as Record<string, unknown>[]).map(rowToComprovacao);
  }

  async findById(id: string): Promise<Comprovacao | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM comprovacoes WHERE id = $1',
      [id]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToComprovacao(row) : null;
  }

  async create(input: ComprovacaoInput, demandaIds: string[]): Promise<Comprovacao> {
    if (demandaIds.length === 0) {
      throw new Error("É necessário vincular a comprovação a pelo menos uma demanda.");
    }

    const pool = getPool();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO comprovacoes (id, "nomeArquivo", "tipoArquivo", tamanho, "caminhoArquivo", descricao, autor, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        input.nomeArquivo,
        input.tipoArquivo,
        input.tamanho,
        input.caminhoArquivo,
        input.descricao || null,
        input.autor,
        createdAt,
      ]
    );

    for (const demandaId of demandaIds) {
      await pool.query(
        `INSERT INTO comprovacao_demandas (comprovacao_id, demanda_id) VALUES ($1, $2)`,
        [id, demandaId]
      );
    }

    return {
      id,
      nomeArquivo: input.nomeArquivo,
      tipoArquivo: input.tipoArquivo,
      tamanho: input.tamanho,
      caminhoArquivo: input.caminhoArquivo,
      descricao: input.descricao,
      autor: input.autor,
      createdAt,
    };
  }

  async unlinkDemanda(comprovacaoId: string, demandaId: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      "DELETE FROM comprovacao_demandas WHERE comprovacao_id = $1 AND demanda_id = $2",
      [comprovacaoId, demandaId]
    );
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    const comprovacao = await this.findById(id);
    if (comprovacao) {
      const filePath = path.join(UPLOADS_DIR, comprovacao.caminhoArquivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await pool.query(
        "DELETE FROM comprovacao_demandas WHERE comprovacao_id = $1",
        [id]
      );
      await pool.query("DELETE FROM comprovacoes WHERE id = $1", [id]);
    }
  }

  async findDemandaIdsWithComprovacoes(agenciaId: string): Promise<string[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT DISTINCT cd.demanda_id as "demandaId"
       FROM comprovacao_demandas cd
       INNER JOIN demandas d ON cd.demanda_id = d.id
       WHERE d."agenciaId" = $1`,
      [agenciaId]
    );
    return (result.rows as Array<{ demandaId: string }>).map((r) => r.demandaId);
  }
}
