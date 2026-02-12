import type {
  DemandaFilterOptions,
  DemandaFilters,
  IDemandaRepository,
} from "@/lib/domain/demanda.repository";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  solicitanteRepository: ISolicitanteRepository;
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: obter opções para os filtros de demandas. */
export async function getDemandasFilterOptionsUseCase(
  filters: DemandaFilters | undefined,
  deps: Dependencies
): Promise<DemandaFilterOptions> {
  const [baseOptions, solicitantes, agencias] = await Promise.all([
    deps.demandaRepository.getFilterOptions(filters),
    deps.solicitanteRepository.findAll(),
    deps.agenciaRepository.findAll(),
  ]);

  const solicitantesComUnidade = solicitantes.map((s) => ({
    nome: s.nome,
    unResponsavel: s.unResponsavel,
  }));
  const solicitantesNomes = solicitantesComUnidade.map((s) => s.nome);
  const agenciasNomes = agencias.map((a) => a.nomeFantasia).sort();

  return {
    ...baseOptions,
    solicitantes: [...new Set([...baseOptions.solicitantes, ...solicitantesNomes])].sort(),
    solicitantesComUnidade,
    agencias: agenciasNomes,
  };
}
