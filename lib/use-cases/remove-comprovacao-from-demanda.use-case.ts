import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";

type Dependencies = {
  demandaComprovacaoRepository: IDemandaComprovacaoRepository;
  demandaRepository: IDemandaRepository;
};

/**
 * Remove uma comprovação a partir do contexto de uma demanda:
 * - Se a comprovação estiver vinculada a apenas esta demanda, remove a comprovação inteira.
 * - Se estiver vinculada a mais de uma demanda, remove apenas o vínculo com a demanda informada.
 *
 * Regra de negócio adicional:
 * - Se a demanda ficar sem comprovações após a remoção/desvínculo, reverte o status para "comprometido".
 */
export async function removeComprovacaoFromDemandaUseCase(
  input: { demandaId: string; comprovacaoId: string },
  deps: Dependencies
): Promise<{ removedComprovacao: boolean; revertedDemandaStatus: boolean }> {
  const demandaId = input.demandaId;
  const comprovacaoId = input.comprovacaoId;

  const demandaIds = await deps.demandaComprovacaoRepository.findDemandaIdsByComprovacaoId(
    comprovacaoId
  );

  if (!demandaIds.includes(demandaId)) {
    throw new Error("Esta comprovação não está vinculada a esta demanda.");
  }

  const comprovacoesDaDemanda = await deps.demandaComprovacaoRepository.findByDemandaId(
    demandaId
  );
  const demandaVaiFicarSemComprovacoes =
    comprovacoesDaDemanda.length === 1 && comprovacoesDaDemanda[0]?.id === comprovacaoId;

  const removeComprovacaoInteira = demandaIds.length === 1;

  if (removeComprovacaoInteira) {
    await deps.demandaComprovacaoRepository.remove(comprovacaoId);
  } else {
    await deps.demandaComprovacaoRepository.unlinkDemanda(comprovacaoId, demandaId);
  }

  let revertedDemandaStatus = false;
  if (demandaVaiFicarSemComprovacoes) {
    const demanda = await deps.demandaRepository.findById(demandaId);
    if (demanda) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...updateInput } = demanda;
      await deps.demandaRepository.update(demandaId, { ...updateInput, status: "comprometido" });
      revertedDemandaStatus = true;
    }
  }

  return { removedComprovacao: removeComprovacaoInteira, revertedDemandaStatus };
}

