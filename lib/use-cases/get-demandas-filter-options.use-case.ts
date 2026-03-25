import type {
  DemandaFilterOptions,
  DemandaFilters,
  IDemandaRepository,
} from "@/lib/domain/demanda.repository";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import type { IDeskfyImportBoardRepository } from "@/lib/domain/deskfy-import-board.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  solicitanteRepository: ISolicitanteRepository;
  agenciaRepository: IAgenciaRepository;
  deskfyImportBoardRepository?: IDeskfyImportBoardRepository;
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
    unResponsavel: s.unResponsavel ?? "",
  }));
  const solicitantesNomes = solicitantesComUnidade.map((s) => s.nome);
  const agenciasNomes = agencias.map((a) => a.nomeFantasia).sort();

  let agenciaPorBoard: Record<string, string> | undefined;
  if (deps.deskfyImportBoardRepository) {
    const boards = await deps.deskfyImportBoardRepository.findAll();
    const boardPorId = new Map(boards.map((b) => [b.id, b.nome]));
    agenciaPorBoard = {};
    for (const a of agencias) {
      if (a.boardId) {
        const boardNome = boardPorId.get(a.boardId);
        if (boardNome) {
          agenciaPorBoard[boardNome] = a.nomeFantasia;
        }
      }
    }
  }

  return {
    ...baseOptions,
    solicitantes: [...new Set([...baseOptions.solicitantes, ...solicitantesNomes])].sort(),
    solicitantesComUnidade,
    agencias: agenciasNomes,
    agenciaPorBoard,
  };
}
