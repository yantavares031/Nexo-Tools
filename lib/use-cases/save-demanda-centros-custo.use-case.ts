import type { DemandaCentroCustoInput } from "@/types/globals";
import type { IDemandaCentroCustoRepository } from "@/lib/domain/demanda-centro-custo.repository";

type Dependencies = {
  demandaCentroCustoRepository: IDemandaCentroCustoRepository;
};

/**
 * Caso de uso: salvar centros de custo de uma demanda.
 * Remove todos os centros de custo existentes e cria os novos.
 */
export async function saveDemandaCentrosCustoUseCase(
  demandaId: string,
  centrosCusto: Array<Omit<DemandaCentroCustoInput, "demandaId">>,
  deps: Dependencies
): Promise<void> {
  // Remover todos os centros de custo existentes
  await deps.demandaCentroCustoRepository.removeByDemandaId(demandaId);

  // Criar novos centros de custo
  for (let i = 0; i < centrosCusto.length; i++) {
    const cc = centrosCusto[i];
    await deps.demandaCentroCustoRepository.create({
      demandaId,
      centroDeCusto: cc.centroDeCusto,
      valor: cc.valor,
      ordem: i,
    });
  }
}
