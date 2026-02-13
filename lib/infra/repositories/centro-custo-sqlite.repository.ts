/**
 * Implementação SQLite do repositório de centros de custo.
 */

import { randomUUID } from "crypto";
import type { ICentroCustoRepository } from "@/lib/domain/centro-custo.repository";
import type { CentroCusto, CentroCustoInput } from "@/types/globals";
import { getDb } from "@/DB/db";

export class CentroCustoSqliteRepository implements ICentroCustoRepository {
  findAll(): CentroCusto[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT id, nome, createdAt, updatedAt FROM centros_custo ORDER BY nome")
      .all() as Array<{
      id: string;
      nome: string;
      createdAt: string;
      updatedAt: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
    }));
  }

  findById(id: string): CentroCusto | null {
    const db = getDb();
    const row = db
      .prepare("SELECT id, nome, createdAt, updatedAt FROM centros_custo WHERE id = ?")
      .get(id) as
      | {
          id: string;
          nome: string;
          createdAt: string;
          updatedAt: string | null;
        }
      | undefined;

    if (!row) return null;

    return {
      id: row.id,
      nome: row.nome,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
    };
  }

  findByName(nome: string): CentroCusto | null {
    const db = getDb();
    const row = db
      .prepare("SELECT id, nome, createdAt, updatedAt FROM centros_custo WHERE nome = ?")
      .get(nome) as
      | {
          id: string;
          nome: string;
          createdAt: string;
          updatedAt: string | null;
        }
      | undefined;

    if (!row) return null;

    return {
      id: row.id,
      nome: row.nome,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
    };
  }

  create(input: CentroCustoInput): CentroCusto {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db
      .prepare(
        "INSERT INTO centros_custo (id, nome, createdAt, updatedAt) VALUES (?, ?, ?, ?)"
      )
      .run(id, input.nome, now, now);

    return {
      id,
      nome: input.nome,
      createdAt: now,
      updatedAt: now,
    };
  }

  update(id: string, input: Partial<CentroCustoInput>): CentroCusto | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (input.nome !== undefined) {
      updates.push("nome = ?");
      values.push(input.nome);
    }

    if (updates.length === 0) return existing;

    updates.push("updatedAt = ?");
    values.push(new Date().toISOString());
    values.push(id);

    const db = getDb();
    db.prepare(`UPDATE centros_custo SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    return this.findById(id);
  }

  remove(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM centros_custo WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
