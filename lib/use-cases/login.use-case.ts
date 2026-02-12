import type { IUserRepository } from "@/lib/domain/user.repository";

type Dependencies = {
  userRepository: IUserRepository;
};

/** Caso de uso: validar credenciais e retornar usuário se válido. */
export async function loginUseCase(
  email: string,
  password: string,
  deps: Dependencies
): Promise<{ id: string; email: string; name?: string } | null> {
  const user = await deps.userRepository.findByEmail(email);
  if (!user || user.password !== password) return null;
  return { id: user.id, email: user.email, name: user.name };
}
