import type { WebhookEventCode } from "@/types/globals";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";
import type { IWebhookSender } from "@/lib/domain/webhook-sender";
import { logUseCaseError } from "@/lib/server-action-log";
import { getWebhookConfigUseCase } from "./get-webhook-config.use-case";

type Dependencies = {
  webhookConfigRepository: IWebhookConfigRepository;
  webhookSender: IWebhookSender;
};

/**
 * Dispara o webhook para um evento se a configuração estiver habilitada e o evento estiver na lista.
 * Regra de negócio: "quando X acontece, notificar via webhook se configurado".
 * Falhas no envio não são propagadas (fire-and-forget) para não impactar o fluxo principal.
 */
export async function dispatchWebhookForEventUseCase(
  eventCode: WebhookEventCode,
  payload: Record<string, unknown>,
  deps: Dependencies
): Promise<void> {
  const config = await getWebhookConfigUseCase({
    webhookConfigRepository: deps.webhookConfigRepository,
  });
  if (!config.enabled || !config.url?.trim() || !config.events.includes(eventCode)) {
    return;
  }
  const body: Record<string, unknown> = {
    event: eventCode,
    ...payload,
    timestamp: new Date().toISOString(),
  };
  if (config.whatsappMod && config.contactList?.length) {
    body.contact_list = config.contactList;
  }
  try {
    await deps.webhookSender.send(config.url.trim(), body);
  } catch (err) {
    await logUseCaseError("dispatchWebhookForEventUseCase", err, {
      eventCode,
      webhookUrl: config.url.trim(),
    });
  }
}
