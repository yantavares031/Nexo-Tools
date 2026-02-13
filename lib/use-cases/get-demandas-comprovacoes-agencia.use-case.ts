import type { Demanda } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  comprovacaoRepository: IDemandaComprovacaoRepository;
};

export interface DemandasComprovacoesResult {
  comprovadas: Demanda[];
  naoComprovadas: Demanda[];
  totalComprovadas: number;
  totalNaoComprovadas: number;
}

/** Caso de uso: obter relatório de demandas comprovadas e não comprovadas para uma agência. */
export async function getDemandasComprovacoesAgenciaUseCase(
  agenciaId: string,
  deps: Dependencies
): Promise<DemandasComprovacoesResult> {
  // Buscar todas as demandas da agência
  const demandas = await deps.demandaRepository.findAll({ agenciaId });

  // Buscar IDs de demandas que têm comprovações
  const demandaIdsComComprovacoes = await deps.comprovacaoRepository.findDemandaIdsWithComprovacoes(
    agenciaId
  );
  const setComprovadas = new Set(demandaIdsComComprovacoes);

  // Separar em comprovadas e não comprovadas
  const comprovadas: Demanda[] = [];
  const naoComprovadas: Demanda[] = [];

  for (const demanda of demandas) {
    if (setComprovadas.has(demanda.id)) {
      comprovadas.push(demanda);
    } else {
      naoComprovadas.push(demanda);
    }
  }

  return {
    comprovadas,
    naoComprovadas,
    totalComprovadas: comprovadas.length,
    totalNaoComprovadas: naoComprovadas.length,
  };
}
