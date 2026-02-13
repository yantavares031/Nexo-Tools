/** Contrato para envio de payload via HTTP POST (webhook). Use case depende disso; infra implementa com fetch. */
export interface IWebhookSender {
  send(url: string, payload: object): Promise<void>;
}
