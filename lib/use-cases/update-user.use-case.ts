import type { User, UserUpdateInput } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";
import { hashPassword } from "@/lib/password";

type Dependencies = {
  userRepository: IUserRepository;
};

/** Regra: e-mail deve ser único (exceto o próprio usuário). Agency precisa de agenciaId. */
export async function updateUserUseCase(
  id: string,
  input: UserUpdateInput,
  deps: Dependencies
): Promise<User> {
  const existente = await deps.userRepository.findById(id);
  if (!existente) {
    throw new Error("Usuário não encontrado.");
  }

  const outroComEmail = await deps.userRepository.findByEmail(input.email);
  if (outroComEmail && outroComEmail.id !== id) {
    throw new Error("Já existe outro usuário cadastrado com este e-mail.");
  }

  if (input.role === "agency" && !input.agenciaId) {
    throw new Error("Usuários do tipo Agência precisam ter uma agência vinculada.");
  }

  let payload: UserUpdateInput = input;
  if (input.password && input.password.trim().length > 0) {
    payload = {
      ...input,
      password: hashPassword(input.password.trim()),
      temporaryPassword: null,
    };
  }

  return deps.userRepository.update(id, payload);
}
