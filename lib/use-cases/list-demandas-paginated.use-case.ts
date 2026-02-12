import type {
  IDemandaRepository,
  DemandaFilters,
  DemandaPagination,
  DemandaPaginatedResult,
} from "@/lib/domain/demanda.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
};

/** Caso de uso: listar demandas com filtros e paginação (backend). */
export async function listDemandasPaginatedUseCase(
  filters: DemandaFilters | undefined,
  pagination: DemandaPagination,
  deps: Dependencies
): Promise<DemandaPaginatedResult> {
  return deps.demandaRepository.findPaginated(filters, pagination);
}
