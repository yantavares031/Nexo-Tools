import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";

type Dependencies = {
  solicitanteRepository: ISolicitanteRepository;
};

/** Caso de uso: remover um solicitante. */
export async function removeSolicitanteUseCase(
  id: string,
  deps: Dependencies
): Promise<void> {
  return deps.solicitanteRepository.remove(id);
}
