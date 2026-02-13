import type { Demanda, DemandaComprovacao, DemandaComprovacaoInput } from "@/types/globals";
import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";
import type { IWebhookSender } from "@/lib/domain/webhook-sender";
import { dispatchWebhookForEventUseCase } from "./dispatch-webhook-for-event.use-case";

type Dependencies = {
  demandaComprovacaoRepository: IDemandaComprovacaoRepository;
  /** Necessário para incluir dados da demanda no payload do webhook "demanda.comprovada". */
  demandaRepository?: IDemandaRepository;
  /** Opcional: quando informado, dispara webhook "demanda.comprovada" após adicionar a comprovação. */
  webhookConfigRepository?: IWebhookConfigRepository;
  webhookSender?: IWebhookSender;
};

/**
 * Caso de uso: adicionar uma comprovação (upload) à demanda.
 * Regra de negócio: quando uma comprovação é adicionada, se o webhook estiver habilitado
 * para "demanda.comprovada", disparar o webhook (com dados da demanda: descrição, oc/pi, agência, etc.).
 */
export async function addDemandaComprovacaoUseCase(
  input: DemandaComprovacaoInput,
  deps: Dependencies
): Promise<DemandaComprovacao> {
  const comprovacao = await deps.demandaComprovacaoRepository.create(input);

  if (deps.webhookConfigRepository && deps.webhookSender) {
    let demanda: Demanda | null = null;
    if (deps.demandaRepository) {
      demanda = await deps.demandaRepository.findById(comprovacao.demandaId);
    }
    await dispatchWebhookForEventUseCase(
      "demanda.comprovada",
      { demandaId: comprovacao.demandaId, comprovacao, demanda },
      {
        webhookConfigRepository: deps.webhookConfigRepository,
        webhookSender: deps.webhookSender,
      }
    );
  }

  return comprovacao;
}
