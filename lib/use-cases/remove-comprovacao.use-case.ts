import type { DemandaHistoricoAlteracao } from "@/types/globals";
import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import {
  formatStatusLabel,
  recordDemandaHistoricoUseCase,
  type HistoricoDeps,
} from "./record-demanda-historico.use-case";

type Dependencies = {
  demandaComprovacaoRepository: IDemandaComprovacaoRepository;
  demandaRepository: IDemandaRepository;
  historico?: HistoricoDeps;
};

/**
 * Remove uma comprovação e todos os seus vínculos.
 * Regra de negócio: demandas que ficarem sem comprovações voltam para "comprometido".
 */
export async function removeComprovacaoUseCase(
  comprovacaoId: string,
  deps: Dependencies
): Promise<void> {
  const comprovacao = await deps.demandaComprovacaoRepository.findById(comprovacaoId);
  if (!comprovacao) {
    throw new Error("Comprovação não encontrada.");
  }
  const demandaIds =
    await deps.demandaComprovacaoRepository.findDemandaIdsByComprovacaoId(comprovacaoId);

  const demandasParaReverter = new Set<string>();
  for (const demandaId of demandaIds) {
    const comprovacoesDaDemanda = await deps.demandaComprovacaoRepository.findByDemandaId(demandaId);
    if (comprovacoesDaDemanda.length === 1 && comprovacoesDaDemanda[0].id === comprovacaoId) {
      demandasParaReverter.add(demandaId);
    }
  }

  await deps.demandaComprovacaoRepository.remove(comprovacaoId);

  for (const demandaId of demandaIds) {
    const alteracoes: DemandaHistoricoAlteracao[] = [];
    if (demandasParaReverter.has(demandaId)) {
      const demanda = await deps.demandaRepository.findById(demandaId);
      if (demanda) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...input } = demanda;
        await deps.demandaRepository.update(demandaId, { ...input, status: "comprometido" });
        if (demanda.status !== "comprometido") {
          alteracoes.push({
            campo: "Status",
            de: formatStatusLabel(demanda.status),
            para: "Comprometido",
          });
        }
      }
    }
    await recordDemandaHistoricoUseCase(
      {
        demandaId,
        tipo: "comprovacao_removida",
        descricao: `Comprovação "${comprovacao.nomeArquivo}" removida`,
        alteracoes,
      },
      deps.historico
    );
  }
}
