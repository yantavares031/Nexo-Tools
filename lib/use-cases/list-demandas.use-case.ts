import type { Demanda } from "@/types/globals";
import type { IDemandaRepository, DemandaFilters } from "@/lib/domain/demanda.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
};

/** Caso de uso: listar demandas com filtros opcionais. */
export async function listDemandasUseCase(
  filters: DemandaFilters | undefined,
  deps: Dependencies
): Promise<Demanda[]> {
  return deps.demandaRepository.findAll(filters);
}
