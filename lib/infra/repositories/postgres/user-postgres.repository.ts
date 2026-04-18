import type { User, UserInput, UserUpdateInput } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";
import { getPool } from "@/lib/infra/db-pg";
import { randomUUID } from "crypto";

function rowToUser(row: Record<string, unknown>): User {
  const acessoRaw = row.acesso;
  const acesso = acessoRaw === undefined || acessoRaw === null ? true : Number(acessoRaw) === 1;
  const tp = row.temporaryPassword;
  return {
    id: String(row.id),
    email: String(row.email),
    password: String(row.password),
    name: row.name ? String(row.name) : undefined,
    role: row.role as User["role"],
    agenciaId: row.agenciaId ? String(row.agenciaId) : undefined,
    acesso,
    temporaryPassword:
      tp !== undefined && tp !== null && String(tp).length > 0 ? String(tp) : undefined,
  };
}

export class UserPostgresRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = $1",
      [normalized]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToUser(row) : null;
  }

  async findAll(): Promise<User[]> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM users ORDER BY COALESCE(name, email)");
    return (result.rows as Record<string, unknown>[]).map(rowToUser);
  }

  async create(input: UserInput): Promise<User> {
    const id = randomUUID();
    const pool = getPool();
    const acesso = input.acesso !== false ? 1 : 0;
    await pool.query(
      `INSERT INTO users (id, email, password, name, role, "agenciaId", acesso, "temporaryPassword") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        input.email,
        input.password,
        input.name ?? null,
        input.role,
        input.agenciaId ?? null,
        acesso,
        input.temporaryPassword ?? null,
      ]
    );
    return { ...input, id, acesso: input.acesso !== false };
  }

  async update(id: string, input: UserUpdateInput): Promise<User> {
    const pool = getPool();
    const currentResult = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    const current = currentResult.rows[0] as Record<string, unknown> | undefined;
    if (!current) throw new Error("Usuário não encontrado.");
    const password = input.password ?? String(current.password);
    const acessoBool =
      input.acesso === undefined ? Number(current.acesso) === 1 : input.acesso;
    const acesso = acessoBool ? 1 : 0;
    const currentTp = current.temporaryPassword;
    const temporaryPassword =
      input.temporaryPassword !== undefined
        ? input.temporaryPassword
        : currentTp !== undefined && currentTp !== null && String(currentTp).length > 0
          ? String(currentTp)
          : null;
    await pool.query(
      `UPDATE users SET email = $1, name = $2, role = $3, "agenciaId" = $4, password = $5, acesso = $6, "temporaryPassword" = $7 WHERE id = $8`,
      [
        input.email,
        input.name ?? null,
        input.role,
        input.agenciaId ?? null,
        password,
        acesso,
        temporaryPassword,
        id,
      ]
    );
    return {
      ...rowToUser(current),
      ...input,
      id,
      password,
      acesso: acessoBool,
      temporaryPassword: temporaryPassword ?? undefined,
    };
  }

  async remove(id: string): Promise<void> {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
  }
}
