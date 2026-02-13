import type { WebhookConfig, WebhookConfigInput } from "@/types/globals";

/** Contrato do repositório de configuração de webhook (uma única configuração global). */
export interface IWebhookConfigRepository {
  get(): Promise<WebhookConfig | null>;
  save(input: WebhookConfigInput): Promise<WebhookConfig>;
}
