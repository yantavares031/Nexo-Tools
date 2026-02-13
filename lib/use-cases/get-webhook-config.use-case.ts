import type { WebhookConfig } from "@/types/globals";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";

type Dependencies = { webhookConfigRepository: IWebhookConfigRepository };

/** Retorna a configuração de webhook ou valores padrão se ainda não existir. */
export async function getWebhookConfigUseCase(
  deps: Dependencies
): Promise<WebhookConfig> {
  const config = await deps.webhookConfigRepository.get();
  if (config) return config;
  return {
    id: "default",
    url: "",
    enabled: false,
    events: [],
    whatsappMod: false,
    contactList: [],
  };
}
