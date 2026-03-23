import type { User, UserInput, UserUpdateInput } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";
import { getDb } from "@/DB/db";

function rowToUser(row: Record<string, unknown>): User {
  const acessoRaw = row.acesso;
  const acesso = acessoRaw === undefined || acessoRaw === null ? true : Number(acessoRaw) === 1;
  return {
    id: String(row.id),
    email: String(row.email),
    password: String(row.password),
    name: row.name ? String(row.name) : undefined,
    role: row.role as User["role"],
    agenciaId: row.agenciaId ? String(row.agenciaId) : undefined,
    acesso,
  };
}

export class UserSqliteRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(normalized) as Record<string, unknown> | undefined;
    return row ? rowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? rowToUser(row) : null;
  }

  async findAll(): Promise<User[]> {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM users ORDER BY COALESCE(name, email)").all() as Record<string, unknown>[];
    return rows.map(rowToUser);
  }

  async create(input: UserInput): Promise<User> {
    const id = String(Date.now());
    const db = getDb();
    const acesso = input.acesso !== false ? 1 : 0;
    db.prepare("INSERT INTO users (id, email, password, name, role, agenciaId, acesso) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, input.email, input.password, input.name ?? null, input.role, input.agenciaId ?? null, acesso);
    return { ...input, id, acesso: input.acesso !== false };
  }

  async update(id: string, input: UserUpdateInput): Promise<User> {
    const db = getDb();
    const current = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!current) throw new Error("Usuário não encontrado.");
    const password = input.password ?? String(current.password);
    const acessoBool = input.acesso === undefined ? current.acesso : input.acesso;
    const acesso = acessoBool ? 1 : 0;
    db.prepare("UPDATE users SET email = ?, name = ?, role = ?, agenciaId = ?, password = ?, acesso = ? WHERE id = ?").run(input.email, input.name ?? null, input.role, input.agenciaId ?? null, password, acesso, id);
    return { ...current, ...input, id, password, acesso: acessoBool } as User;
  }

  async remove(id: string): Promise<void> {
    const db = getDb();
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  }
}
