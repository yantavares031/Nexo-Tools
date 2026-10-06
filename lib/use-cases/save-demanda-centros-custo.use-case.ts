import type { DemandaCentroCustoInput } from "@/types/globals";
import type { IDemandaCentroCustoRepository } from "@/lib/domain/demanda-centro-custo.repository";
import { formatBrazilianCurrency } from "@/lib/currency";
import {
  recordDemandaHistoricoUseCase,
  type HistoricoDeps,
} from "./record-demanda-historico.use-case";

type Dependencies = {
  demandaCentroCustoRepository: IDemandaCentroCustoRepository;
  historico?: HistoricoDeps;
};

function describeCentros(centros: Array<{ centroDeCusto: string; valor: number }>): string {
  if (centros.length === 0) return "—";
  return centros.map((cc) => `${cc.centroDeCusto} (R$ ${formatBrazilianCurrency(cc.valor)})`).join("; ");
}

/**
 * Caso de uso: salvar centros de custo de uma demanda.
 * Remove todos os centros de custo existentes e cria os novos.
 */
export async function saveDemandaCentrosCustoUseCase(
  demandaId: string,
  centrosCusto: Array<Omit<DemandaCentroCustoInput, "demandaId">>,
  deps: Dependencies
): Promise<void> {
  const anteriores = deps.historico
    ? await deps.demandaCentroCustoRepository.findByDemandaId(demandaId)
    : [];

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

  if (deps.historico) {
    const de = describeCentros(anteriores);
    const para = describeCentros(centrosCusto);
    if (de !== para) {
      await recordDemandaHistoricoUseCase(
        {
          demandaId,
          tipo: "centros_custo_alterados",
          descricao: "Rateio de centros de custo alterado",
          alteracoes: [{ campo: "Centros de custo", de, para }],
        },
        deps.historico
      );
    }
  }
}
