import type { Demanda } from "@/types/globals";
import type { IDemandaRepository, DemandaFilters } from "@/lib/domain/demanda.repository";

type Dependencies = { demandaRepository: IDemandaRepository };

/**
 * Retorna demandas elegíveis para vincular comprovações:
 * status entregue ou comprometido, opcionalmente filtradas por mes e busca.
 */
export async function getDemandasParaComprovacaoUseCase(
  filters: { mes?: string; search?: string; agenciaId?: string },
  deps: Dependencies
): Promise<Demanda[]> {
  const repoFilters: DemandaFilters = {
    statusIn: ["entregue", "comprometido"],
    search: filters.search?.trim() || undefined,
    mes: filters.mes?.trim() || undefined,
    agenciaId: filters.agenciaId,
  };
  return deps.demandaRepository.findAll(repoFilters);
}
