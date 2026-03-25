import type { IUserRepository } from "@/lib/domain/user.repository";
import { hashPassword } from "@/lib/password";

type Dependencies = {
  userRepository: IUserRepository;
};

/**
 * Primeiro acesso: define nova senha e remove a senha temporária.
 * Só aplica se o usuário ainda tiver temporaryPassword preenchida.
 */
export async function changePasswordFirstAccessUseCase(
  input: { userId: string; newPassword: string; confirmPassword: string },
  deps: Dependencies
): Promise<void> {
  const { newPassword, confirmPassword } = input;
  if (newPassword.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("A confirmação não coincide com a nova senha.");
  }

  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }
  if (!user.temporaryPassword || String(user.temporaryPassword).length === 0) {
    throw new Error("Não é necessário alterar a senha neste momento.");
  }

  const hashed = hashPassword(newPassword);
  await deps.userRepository.update(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
    agenciaId: user.agenciaId,
    acesso: user.acesso,
    password: hashed,
    temporaryPassword: null,
  });
}
