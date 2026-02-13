import type { WebhookConfigInput } from "@/types/globals";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";

type Dependencies = { webhookConfigRepository: IWebhookConfigRepository };

/**
 * Salva a configuração global de webhook.
 * Regra: se enabled for true, url não pode ser vazia.
 */
export async function saveWebhookConfigUseCase(
  input: WebhookConfigInput,
  deps: Dependencies
): Promise<{ success: true } | { error: string }> {
  if (input.enabled && !input.url?.trim()) {
    return { error: "Informe a URL do webhook para habilitar." };
  }
  await deps.webhookConfigRepository.save({
    url: input.url?.trim() ?? "",
    enabled: input.enabled ?? false,
    events: input.events ?? [],
    whatsappMod: input.whatsappMod ?? false,
    contactList: input.contactList ?? [],
  });
  return { success: true };
}
