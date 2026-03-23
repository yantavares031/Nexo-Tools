import type {
  IDeskfyImportBoardRepository,
  DeskfyImportBoard,
} from "@/lib/domain/deskfy-import-board.repository";
import { getDb } from "@/DB/db";
import { randomUUID } from "crypto";

export class DeskfyImportBoardSqliteRepository
  implements IDeskfyImportBoardRepository
{
  async findAll(): Promise<DeskfyImportBoard[]> {
    const db = getDb();
    const rows = db
      .prepare("SELECT id, nome FROM deskfy_import_boards ORDER BY nome")
      .all() as Array<{ id: string; nome: string }>;
    return rows;
  }

  async findByName(nome: string): Promise<DeskfyImportBoard | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT id, nome FROM deskfy_import_boards WHERE nome = ?")
      .get(nome.trim()) as { id: string; nome: string } | undefined;
    return row ?? null;
  }

  async create(nome: string): Promise<DeskfyImportBoard> {
    const db = getDb();
    const id = randomUUID();
    const nomeTrim = nome.trim();
    if (!nomeTrim) throw new Error("Nome do board é obrigatório");
    db.prepare("INSERT INTO deskfy_import_boards (id, nome) VALUES (?, ?)").run(
      id,
      nomeTrim
    );
    return { id, nome: nomeTrim };
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    const result = db
      .prepare("DELETE FROM deskfy_import_boards WHERE id = ?")
      .run(id);
    if (result.changes === 0) throw new Error("Board não encontrado");
  }
}
