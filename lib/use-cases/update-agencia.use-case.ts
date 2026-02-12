import type { Agencia, AgenciaInput } from "@/types/globals";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = {
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: atualizar uma agência. */
export async function updateAgenciaUseCase(
  id: string,
  input: AgenciaInput,
  deps: Dependencies
): Promise<Agencia> {
  return deps.agenciaRepository.update(id, input);
}
