import type {
  IDeskfyImportBoardRepository,
  DeskfyImportBoard,
} from "@/lib/domain/deskfy-import-board.repository";
import { getPool } from "@/lib/infra/db-pg";
import { randomUUID } from "crypto";

export class DeskfyImportBoardPostgresRepository
  implements IDeskfyImportBoardRepository
{
  async findAll(): Promise<DeskfyImportBoard[]> {
    const pool = getPool();
    const result = await pool.query(
      "SELECT id, nome FROM deskfy_import_boards ORDER BY nome"
    );
    return result.rows as DeskfyImportBoard[];
  }

  async findByName(nome: string): Promise<DeskfyImportBoard | null> {
    const pool = getPool();
    const result = await pool.query(
      "SELECT id, nome FROM deskfy_import_boards WHERE nome = $1",
      [nome.trim()]
    );
    const row = result.rows[0] as DeskfyImportBoard | undefined;
    return row ?? null;
  }

  async create(nome: string): Promise<DeskfyImportBoard> {
    const pool = getPool();
    const id = randomUUID();
    const nomeTrim = nome.trim();
    if (!nomeTrim) throw new Error("Nome do board é obrigatório");
    await pool.query(
      "INSERT INTO deskfy_import_boards (id, nome) VALUES ($1, $2)",
      [id, nomeTrim]
    );
    return { id, nome: nomeTrim };
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    const result = await pool.query(
      "DELETE FROM deskfy_import_boards WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) throw new Error("Board não encontrado");
  }
}
