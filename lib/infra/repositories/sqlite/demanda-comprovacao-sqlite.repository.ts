import type { Comprovacao, ComprovacaoInput } from "@/types/globals";
import type {
  IDemandaComprovacaoRepository,
  ComprovacaoListItem,
  ComprovacaoPaginatedResult,
} from "@/lib/domain/demanda-comprovacao.repository";
import { getDb } from "@/DB/db";
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

export class DemandaComprovacaoSqliteRepository implements IDemandaComprovacaoRepository {
  async findAll(filters?: { agenciaId?: string; q?: string }): Promise<ComprovacaoListItem[]> {
    const db = getDb();
    const q = (filters?.q ?? "").trim();
    const qLike = `%${q}%`;
    let query: string;
    let params: unknown[];
    if (filters?.agenciaId) {
      query = `SELECT c.*, 
        (SELECT COUNT(*) FROM comprovacao_demandas cd2 WHERE cd2.comprovacao_id = c.id) as demandaCount
        FROM comprovacoes c
        INNER JOIN comprovacao_demandas cd ON c.id = cd.comprovacao_id
        INNER JOIN demandas d ON cd.demanda_id = d.id
        WHERE d.agenciaId = ?
        ${q ? "AND COALESCE(c.descricao, '') LIKE ?" : ""}
        GROUP BY c.id
        ORDER BY c.createdAt DESC`;
      params = q ? [filters.agenciaId, qLike] : [filters.agenciaId];
    } else {
      query = `SELECT c.*, 
        (SELECT COUNT(*) FROM comprovacao_demandas cd WHERE cd.comprovacao_id = c.id) as demandaCount
        FROM comprovacoes c
        ${q ? "WHERE COALESCE(c.descricao, '') LIKE ?" : ""}
        ORDER BY c.createdAt DESC`;
      params = q ? [qLike] : [];
    }
    const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      ...rowToComprovacao(row),
      demandaCount: Number(row.demandaCount ?? 0),
    }));
  }

  async findPaginated(
    filters: { agenciaId?: string; q?: string } | undefined,
    pagination: { page: number; limit: number }
  ): Promise<ComprovacaoPaginatedResult> {
    const db = getDb();
    const { page, limit } = pagination;
    const q = (filters?.q ?? "").trim();
    const qLike = `%${q}%`;
    let baseQuery: string;
    let countQuery: string;
    let params: unknown[];

    if (filters?.agenciaId) {
      baseQuery = `FROM comprovacoes c
        INNER JOIN comprovacao_demandas cd ON c.id = cd.comprovacao_id
        INNER JOIN demandas d ON cd.demanda_id = d.id
        WHERE d.agenciaId = ?
        ${q ? "AND COALESCE(c.descricao, '') LIKE ?" : ""}`;
      countQuery = `SELECT COUNT(DISTINCT c.id) as total ${baseQuery}`;
      params = q ? [filters.agenciaId, qLike] : [filters.agenciaId];
    } else {
      baseQuery = `FROM comprovacoes c ${q ? "WHERE COALESCE(c.descricao, '') LIKE ?" : ""}`;
      countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      params = q ? [qLike] : [];
    }

    const countRow = db.prepare(countQuery).get(...params) as { total: number };
    const total = countRow.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const offset = (pageSafe - 1) * limit;

    const dataQuery = `SELECT c.*, 
      (SELECT COUNT(*) FROM comprovacao_demandas cd2 WHERE cd2.comprovacao_id = c.id) as demandaCount
      ${baseQuery}
      ${filters?.agenciaId ? "GROUP BY c.id" : ""}
      ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(dataQuery).all(...params, limit, offset) as Array<Record<string, unknown>>;
    const items = rows.map((row) => ({
      ...rowToComprovacao(row),
      demandaCount: Number(row.demandaCount ?? 0),
    }));

    return {
      items,
      total,
      page: pageSafe,
      limit,
      totalPages,
    };
  }

  async findDemandaIdsByComprovacaoId(comprovacaoId: string): Promise<string[]> {
    const db = getDb();
    const rows = db
      .prepare("SELECT demanda_id as demandaId FROM comprovacao_demandas WHERE comprovacao_id = ?")
      .all(comprovacaoId) as Array<{ demandaId: string }>;
    return rows.map((r) => r.demandaId);
  }

  async findByDemandaId(demandaId: string): Promise<Comprovacao[]> {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT c.* FROM comprovacoes c
         INNER JOIN comprovacao_demandas cd ON c.id = cd.comprovacao_id
         WHERE cd.demanda_id = ?
         ORDER BY c.createdAt DESC`
      )
      .all(demandaId) as Array<Record<string, unknown>>;
    return rows.map(rowToComprovacao);
  }

  async findById(id: string): Promise<Comprovacao | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM comprovacoes WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToComprovacao(row) : null;
  }

  async create(input: ComprovacaoInput, demandaIds: string[]): Promise<Comprovacao> {
    if (demandaIds.length === 0) {
      throw new Error("É necessário vincular a comprovação a pelo menos uma demanda.");
    }

    const db = getDb();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      "INSERT INTO comprovacoes (id, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, descricao, autor, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      id,
      input.nomeArquivo,
      input.tipoArquivo,
      input.tamanho,
      input.caminhoArquivo,
      input.descricao || null,
      input.autor,
      createdAt
    );

    const insLink = db.prepare("INSERT INTO comprovacao_demandas (comprovacao_id, demanda_id) VALUES (?, ?)");
    for (const demandaId of demandaIds) {
      insLink.run(id, demandaId);
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
    const db = getDb();
    db.prepare("DELETE FROM comprovacao_demandas WHERE comprovacao_id = ? AND demanda_id = ?").run(
      comprovacaoId,
      demandaId
    );
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    const comprovacao = await this.findById(id);
    if (comprovacao) {
      const filePath = path.join(UPLOADS_DIR, comprovacao.caminhoArquivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      db.prepare("DELETE FROM comprovacao_demandas WHERE comprovacao_id = ?").run(id);
      db.prepare("DELETE FROM comprovacoes WHERE id = ?").run(id);
    }
  }

  async findDemandaIdsWithComprovacoes(agenciaId: string): Promise<string[]> {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT DISTINCT cd.demanda_id as demandaId
         FROM comprovacao_demandas cd
         INNER JOIN demandas d ON cd.demanda_id = d.id
         WHERE d.agenciaId = ?`
      )
      .all(agenciaId) as Array<{ demandaId: string }>;
    return rows.map((r) => r.demandaId);
  }
}
