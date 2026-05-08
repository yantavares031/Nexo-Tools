/**
 * Contrato da API WhatsApp por plataforma (UAZAPI, futuros provedores).
 * Implementações em lib/infra/whatsapp/.
 */

export interface WhatsAppProviderInstanceSnapshot {
  id: string;
  token: string;
  name?: string | null;
  status?: string | null;
  paircode?: string | null;
  qrcode?: string | null;
  profileName?: string | null;
  profilePicUrl?: string | null;
  raw: Record<string, unknown>;
}

export interface WhatsAppInstanceStatusResult {
  instance: WhatsAppProviderInstanceSnapshot;
  statusBlock?: {
    connected?: boolean;
    loggedIn?: boolean;
    jid?: string | null;
  };
}

export interface IWhatsAppProvider {
  listInstances(
    baseUrl: string,
    adminToken: string
  ): Promise<WhatsAppProviderInstanceSnapshot[]>;
  getInstanceStatus(
    baseUrl: string,
    instanceToken: string,
    options?: { apiToken?: string }
  ): Promise<WhatsAppInstanceStatusResult>;
  /** Perfil comercial (WhatsApp Business). Retorna null se indisponível ou não aplicável. */
  fetchBusinessProfile(
    baseUrl: string,
    instanceToken: string,
    jid: string,
    options?: { apiToken?: string }
  ): Promise<unknown | null>;
  /**
   * UAZAPI: `POST /instance/updateDelaySettings` — intervalo entre mensagens na fila quando
   * `async=true` em `/send/text`.
   */
  updateInstanceDelaySettings(
    baseUrl: string,
    instanceToken: string,
    msgDelayMin: number,
    msgDelayMax: number,
    options?: { apiToken?: string }
  ): Promise<void>;
  /**
   * UAZAPI: `POST /send/text` — usa fila async quando `async` é true (recomendado para notificações).
   */
  sendTextMessage(
    baseUrl: string,
    instanceToken: string,
    params: { number: string; text: string; async?: boolean },
    options?: { apiToken?: string }
  ): Promise<void>;
}
