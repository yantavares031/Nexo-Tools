import type { WhatsAppIntegrationConfig } from "@/types/globals";

export type WhatsAppCredentialsInput = {
  platform: string;
  baseUrl: string;
  /** Vazio mantém o valor já salvo. */
  adminToken: string;
  /** Vazio mantém o valor já salvo. */
  apiToken: string;
  /** Campos não sensíveis por provedor (persistidos em JSON). */
  providerFields: {
    zapiInstanceId?: string;
    evolutionInstanceName?: string;
  };
};

export type WhatsAppInstancePersistInput = {
  selectedInstanceId: string;
  instanceToken: string;
  instanceName: string | null;
  instanceStatus: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
  profilePicStorageKey: string | null;
  businessProfileJson: string | null;
  instancePayloadJson: string | null;
};

export interface IWhatsAppIntegrationRepository {
  get(): Promise<WhatsAppIntegrationConfig | null>;
  saveCredentials(input: WhatsAppCredentialsInput): Promise<WhatsAppIntegrationConfig>;
  saveInstanceSelection(input: WhatsAppInstancePersistInput): Promise<WhatsAppIntegrationConfig>;
  /** Remove vínculo da instância (mantém URL/tokens da API). */
  clearConnectedInstance(): Promise<WhatsAppIntegrationConfig>;
  /** Lista deduplicada persistida como JSON (notificações WhatsApp). */
  saveNotifyRecipients(recipients: string[]): Promise<WhatsAppIntegrationConfig>;
  /** Intervalo da fila async UAZAPI (`msg_delay_min` / `msg_delay_max`). */
  saveAsyncDelaySettings(msgDelayMin: number, msgDelayMax: number): Promise<WhatsAppIntegrationConfig>;
}
