import type { IWebhookSender } from "@/lib/domain/webhook-sender";

/** Implementação que envia o payload via fetch POST. Usado pelo use case de dispatch (não falha o fluxo principal). */
export class FetchWebhookSender implements IWebhookSender {
  async send(url: string, payload: object): Promise<void> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new Error(`Webhook ${res.status}: ${res.statusText}`);
    }
  }
}

let instance: IWebhookSender | null = null;

export function getWebhookSender(): IWebhookSender {
  if (!instance) instance = new FetchWebhookSender();
  return instance;
}
