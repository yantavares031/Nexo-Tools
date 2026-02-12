import type { User } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";

import usersData from "@/data/users.mock.json";

const users = usersData as User[];

/** Implementação mock do repositório — usa JSON local. Depois trocar por Prisma/SQL/etc. */
export class UserMockRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }
}
