import type { User, UserInput, UserUpdateInput } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";

import usersData from "@/data/users.mock.json";

const users = [...(usersData as User[])];

/** Implementação mock do repositório — usa JSON local. Depois trocar por Prisma/SQL/etc. */
export class UserMockRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return users.find((u) => u.id === id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...users].sort((a, b) =>
      (a.name ?? a.email).localeCompare(b.name ?? b.email)
    );
  }

  async create(input: UserInput): Promise<User> {
    const user: User = {
      ...input,
      id: String(Date.now()),
    };
    users.push(user);
    return user;
  }

  async update(id: string, input: UserUpdateInput): Promise<User> {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("Usuário não encontrado.");
    const current = users[index];
    const updated: User = {
      ...current,
      email: input.email,
      name: input.name,
      role: input.role,
      agenciaId: input.agenciaId,
      password: input.password ?? current.password,
    };
    users[index] = updated;
    return updated;
  }

  async remove(id: string): Promise<void> {
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users.splice(index, 1);
    }
  }
}
