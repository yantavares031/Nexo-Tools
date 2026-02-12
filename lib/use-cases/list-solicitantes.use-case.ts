import type { Solicitante } from "@/types/globals";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";

type Dependencies = {
  solicitanteRepository: ISolicitanteRepository;
};

/** Caso de uso: listar todos os solicitantes. */
export async function listSolicitantesUseCase(
  deps: Dependencies
): Promise<Solicitante[]> {
  return deps.solicitanteRepository.findAll();
}
