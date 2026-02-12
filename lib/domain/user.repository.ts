import type { User, UserInput, UserUpdateInput } from "@/types/globals";

/** Contrato do repositório de usuários — permite trocar implementação (mock, Prisma, etc.). */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(input: UserInput): Promise<User>;
  update(id: string, input: UserUpdateInput): Promise<User>;
  remove(id: string): Promise<void>;
}
