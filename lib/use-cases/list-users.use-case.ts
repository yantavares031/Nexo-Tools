import type { User } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";

type Dependencies = {
  userRepository: IUserRepository;
};

/** Caso de uso: listar todos os usuários. */
export async function listUsersUseCase(
  deps: Dependencies
): Promise<User[]> {
  return deps.userRepository.findAll();
}
