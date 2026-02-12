import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = {
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: remover uma agência. */
export async function removeAgenciaUseCase(
  id: string,
  deps: Dependencies
): Promise<void> {
  return deps.agenciaRepository.remove(id);
}
