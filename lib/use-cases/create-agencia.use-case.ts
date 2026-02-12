import type { Agencia, AgenciaInput } from "@/types/globals";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = {
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: criar uma nova agência. */
export async function createAgenciaUseCase(
  input: AgenciaInput,
  deps: Dependencies
): Promise<Agencia> {
  return deps.agenciaRepository.create(input);
}
