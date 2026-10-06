import type { IUserRepository } from "@/lib/domain/user.repository";
import type { IPasswordResetTokenService } from "@/lib/contracts/password-reset-token";
import type { User } from "@/types/globals";
import { hashPassword } from "@/lib/password";

/** Erro com mensagem pensada para o usuário (pode ser exibida na tela). */
export class PasswordResetError extends Error {}

const INVALID_RESET_LINK_MESSAGE = "Este link de redefinição é inválido ou expirou. Peça um novo link.";

type Dependencies = {
  userRepository: IUserRepository;
  tokenService: IPasswordResetTokenService;
};

async function findUserForToken(token: string, now: Date, deps: Dependencies): Promise<User | null> {
  const userId = deps.tokenService.readUserId(token);
  if (!userId) return null;
  const user = await deps.userRepository.findById(userId);
  if (!user || user.acesso === false) return null;
  const isValid = deps.tokenService.verify(token, { userId: user.id, passwordHash: user.password }, now);
  return isValid ? user : null;
}

/** Indica se o link ainda pode ser usado (para a página mostrar o formulário ou o aviso de expirado). */
export async function isPasswordResetTokenValidUseCase(
  input: { token: string; now: Date },
  deps: Dependencies
): Promise<boolean> {
  return (await findUserForToken(input.token, input.now, deps)) !== null;
}

/** Define a nova senha a partir do link enviado por e-mail; também encerra uma senha temporária pendente. */
export async function resetPasswordWithTokenUseCase(
  input: { token: string; newPassword: string; confirmPassword: string; now: Date },
  deps: Dependencies
): Promise<void> {
  if (input.newPassword.length < 6) {
    throw new PasswordResetError("A nova senha deve ter pelo menos 6 caracteres.");
  }
  if (input.newPassword !== input.confirmPassword) {
    throw new PasswordResetError("A confirmação não coincide com a nova senha.");
  }

  const user = await findUserForToken(input.token, input.now, deps);
  if (!user) throw new PasswordResetError(INVALID_RESET_LINK_MESSAGE);

  await deps.userRepository.update(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
    agenciaId: user.agenciaId,
    acesso: user.acesso,
    password: hashPassword(input.newPassword),
    temporaryPassword: null,
  });
}
