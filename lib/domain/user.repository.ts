import type { User } from "@/types/globals";

/** Contrato do repositório de usuários — permite trocar implementação (mock, Prisma, etc.). */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
}
