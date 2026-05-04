import type { UserRole } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";
import { verifyPassword } from "@/lib/password";

type Dependencies = {
  userRepository: IUserRepository;
};

/** Caso de uso: validar credenciais e retornar usuário se válido. */
export async function loginUseCase(
  email: string,
  password: string,
  deps: Dependencies
): Promise<{
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  agenciaId?: string;
  mustChangePassword: boolean;
  avatarKey?: string | null;
} | null> {
  const user = await deps.userRepository.findByEmail(email);
  if (!user || !verifyPassword(password, user.password)) return null;
  if (user.acesso === false) return null;
  const mustChangePassword = Boolean(
    user.temporaryPassword != null && String(user.temporaryPassword).length > 0
  );
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    agenciaId: user.agenciaId,
    mustChangePassword,
    avatarKey: user.avatarKey ?? undefined,
  };
}
