import type { IUserRepository } from "@/lib/domain/user.repository";
import { hashPassword, verifyPassword } from "@/lib/password";

type Dependencies = { userRepository: IUserRepository };

/** Alteração de senha pelo próprio usuário (exige senha atual). */
export async function changeOwnPasswordUseCase(
  input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  },
  deps: Dependencies
): Promise<void> {
  if (input.newPassword.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }
  if (input.newPassword !== input.confirmPassword) {
    throw new Error("A confirmação não coincide com a nova senha.");
  }

  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }
  if (!verifyPassword(input.currentPassword, user.password)) {
    throw new Error("Senha atual incorreta.");
  }

  await deps.userRepository.update(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
    agenciaId: user.agenciaId,
    acesso: user.acesso,
    password: hashPassword(input.newPassword),
    temporaryPassword: null,
    avatarKey: user.avatarKey,
  });
}
