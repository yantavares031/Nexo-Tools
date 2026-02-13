import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import type { Agencia, AgenciaInput } from "@/types/globals";
import { getDb } from "@/DB/db";

function rowToAgencia(row: Record<string, unknown>): Agencia {
  return {
    id: String(row.id),
    nomeFantasia: String(row.nomeFantasia),
    cnpj: String(row.cnpj),
    orcamentoAnual: Number(row.orcamentoAnual),
  };
}

export class AgenciaSqliteRepository implements IAgenciaRepository {
  async findAll(): Promise<Agencia[]> {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM agencias ORDER BY nomeFantasia").all() as Record<string, unknown>[];
    return rows.map(rowToAgencia);
  }

  async findById(id: string): Promise<Agencia | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM agencias WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? rowToAgencia(row) : null;
  }

  async create(input: AgenciaInput): Promise<Agencia> {
    const id = String(Date.now());
    const db = getDb();
    db.prepare(
      "INSERT INTO agencias (id, nomeFantasia, cnpj, orcamentoAnual) VALUES (?, ?, ?, ?)"
    ).run(id, input.nomeFantasia, input.cnpj, input.orcamentoAnual);
    return { ...input, id };
  }

  async update(id: string, input: AgenciaInput): Promise<Agencia> {
    const db = getDb();
    const row = db.prepare("SELECT id FROM agencias WHERE id = ?").get(id);
    if (!row) throw new Error("Agência não encontrada");
    db.prepare(
      "UPDATE agencias SET nomeFantasia = ?, cnpj = ?, orcamentoAnual = ? WHERE id = ?"
    ).run(input.nomeFantasia, input.cnpj, input.orcamentoAnual, id);
    return { ...input, id };
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    db.prepare("DELETE FROM agencias WHERE id = ?").run(id);
  }
}
