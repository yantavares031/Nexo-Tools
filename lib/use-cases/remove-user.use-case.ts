import type { IUserRepository } from "@/lib/domain/user.repository";

type Dependencies = {
  userRepository: IUserRepository;
};

/** Caso de uso: remover um usuário. */
export async function removeUserUseCase(
  id: string,
  deps: Dependencies
): Promise<void> {
  return deps.userRepository.remove(id);
}
