import type { Comprovacao, ComprovacaoInput, Demanda } from "@/types/globals";
import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";
import type { IWebhookSender } from "@/lib/domain/webhook-sender";
import { dispatchWebhookForEventUseCase } from "./dispatch-webhook-for-event.use-case";

type Dependencies = {
  demandaComprovacaoRepository: IDemandaComprovacaoRepository;
  demandaRepository?: IDemandaRepository;
  webhookConfigRepository?: IWebhookConfigRepository;
  webhookSender?: IWebhookSender;
};

/**
 * Caso de uso: adicionar uma comprovação (upload) e vinculá-la a uma ou mais demandas.
 * Regras de negócio:
 * - Quando uma comprovação é vinculada, todas as demandas afetadas têm status alterado para "faturado".
 * - Se o webhook estiver habilitado para "demanda.comprovada", disparar o webhook para cada demanda vinculada.
 */
export async function addDemandaComprovacaoUseCase(
  input: ComprovacaoInput,
  demandaIds: string[],
  deps: Dependencies
): Promise<Comprovacao> {
  const comprovacao = await deps.demandaComprovacaoRepository.create(input, demandaIds);

  if (deps.demandaRepository) {
    for (const demandaId of demandaIds) {
      let demanda: Demanda | null = null;
      try {
        demanda = await deps.demandaRepository.findById(demandaId);
      } catch {
        // ignora
      }
      if (demanda) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...demandaInput } = demanda;
        await deps.demandaRepository.update(demandaId, { ...demandaInput, status: "faturado" });
        demanda = { ...demanda, status: "faturado" };
      }
      if (deps.webhookConfigRepository && deps.webhookSender) {
        await dispatchWebhookForEventUseCase(
          "demanda.comprovada",
          { demandaId, comprovacao, demanda },
          {
            webhookConfigRepository: deps.webhookConfigRepository,
            webhookSender: deps.webhookSender,
          }
        );
      }
    }
  }

  return comprovacao;
}
