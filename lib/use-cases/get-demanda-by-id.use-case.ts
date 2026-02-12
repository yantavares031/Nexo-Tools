import type { Demanda } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
};

/** Caso de uso: obter uma demanda por ID. */
export async function getDemandaByIdUseCase(
  id: string,
  deps: Dependencies
): Promise<Demanda | null> {
  return deps.demandaRepository.findById(id);
}
