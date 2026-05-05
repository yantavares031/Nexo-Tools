import type { DeskfyIntegrationConfig } from "@/types/globals";

export type DeskfyUpsertSettingsInput = {
  baseUrl: string;
  lookbackDays: number;
};

/** Configuração Deskfy (uma linha) — credenciais apenas no servidor. */
export interface IDeskfyConfigRepository {
  get(): Promise<DeskfyIntegrationConfig | null>;
  upsertSettings(input: DeskfyUpsertSettingsInput): Promise<DeskfyIntegrationConfig>;
  setApiKey(apiKey: string): Promise<DeskfyIntegrationConfig>;
}
