import type { DemandaComprovacao, DemandaComprovacaoInput } from "@/types/globals";
import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";
import { getDb } from "@/DB/db";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "comprovacoes");

// Garantir que o diretório existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function rowToDemandaComprovacao(row: Record<string, unknown>): DemandaComprovacao {
  return {
    id: String(row.id),
    demandaId: String(row.demandaId),
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
  async findByDemandaId(demandaId: string): Promise<DemandaComprovacao[]> {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM demanda_comprovacoes WHERE demandaId = ? ORDER BY createdAt DESC")
      .all(demandaId) as Array<Record<string, unknown>>;
    return rows.map(rowToDemandaComprovacao);
  }

  async findById(id: string): Promise<DemandaComprovacao | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM demanda_comprovacoes WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;
    return row ? rowToDemandaComprovacao(row) : null;
  }

  async create(input: DemandaComprovacaoInput): Promise<DemandaComprovacao> {
    const db = getDb();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      "INSERT INTO demanda_comprovacoes (id, demandaId, nomeArquivo, tipoArquivo, tamanho, caminhoArquivo, descricao, autor, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      id,
      input.demandaId,
      input.nomeArquivo,
      input.tipoArquivo,
      input.tamanho,
      input.caminhoArquivo,
      input.descricao || null,
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
      descricao: input.descricao,
      autor: input.autor,
      createdAt,
    };
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    const comprovacao = await this.findById(id);
    if (comprovacao) {
      // Remover arquivo físico
      const filePath = path.join(UPLOADS_DIR, comprovacao.caminhoArquivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Remover registro do banco
      db.prepare("DELETE FROM demanda_comprovacoes WHERE id = ?").run(id);
    }
  }

  async findDemandaIdsWithComprovacoes(agenciaId: string): Promise<string[]> {
    const db = getDb();
    // Buscar IDs de demandas que têm comprovações e pertencem à agência
    const rows = db
      .prepare(
        `SELECT DISTINCT dc.demandaId 
         FROM demanda_comprovacoes dc
         INNER JOIN demandas d ON dc.demandaId = d.id
         WHERE d.agenciaId = ?`
      )
      .all(agenciaId) as Array<{ demandaId: string }>;
    return rows.map((row) => row.demandaId);
  }
}
