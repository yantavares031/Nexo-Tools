import type { Agencia } from "@/types/globals";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = {
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: obter uma agência pelo id. */
export async function getAgenciaByIdUseCase(
  id: string,
  deps: Dependencies
): Promise<Agencia | null> {
  return deps.agenciaRepository.findById(id);
}
