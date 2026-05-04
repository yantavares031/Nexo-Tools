import type { IUserRepository } from "@/lib/domain/user.repository";
import type { User } from "@/types/globals";

type Dependencies = { userRepository: IUserRepository };

/** O próprio usuário altera apenas o nome (e-mail não entra aqui). */
export async function updateOwnProfileNameUseCase(
  input: { userId: string; name: string },
  deps: Dependencies
): Promise<User> {
  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }
  const trimmed = input.name.trim();
  if (trimmed.length < 2) {
    throw new Error("Informe um nome com pelo menos 2 caracteres.");
  }
  return deps.userRepository.update(user.id, {
    email: user.email,
    name: trimmed,
    role: user.role,
    agenciaId: user.agenciaId,
    acesso: user.acesso,
    avatarKey: user.avatarKey,
  });
}
