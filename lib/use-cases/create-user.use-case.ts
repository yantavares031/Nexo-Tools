import type { User, UserInput } from "@/types/globals";
import type { IUserRepository } from "@/lib/domain/user.repository";
import { hashPassword } from "@/lib/password";

type Dependencies = {
  userRepository: IUserRepository;
};

/** Regra: e-mail deve ser único. Agency precisa de agenciaId. */
export async function createUserUseCase(
  input: UserInput,
  deps: Dependencies
): Promise<User> {
  const existente = await deps.userRepository.findByEmail(input.email);
  if (existente) {
    throw new Error("Já existe um usuário cadastrado com este e-mail.");
  }

  if (input.role === "agency" && !input.agenciaId) {
    throw new Error("Usuários do tipo Agência precisam ter uma agência vinculada.");
  }

  const plain = input.password;
  const hashed = hashPassword(plain);
  return deps.userRepository.create({
    ...input,
    password: hashed,
    temporaryPassword: plain,
  });
}
