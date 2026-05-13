import type { DeskfyIntegrationConfig } from "@/types/globals";
import type { IDeskfyConfigRepository } from "@/lib/domain/deskfy-config.repository";

const MIN_LOOKBACK = 0;
const MAX_LOOKBACK = 500;

type Dependencies = { deskfyConfigRepository: IDeskfyConfigRepository };

export type SaveDeskfyIntegrationSettingsInput = {
  baseUrl: string;
  lookbackDays: number;
};

export async function saveDeskfyIntegrationSettingsUseCase(
  input: SaveDeskfyIntegrationSettingsInput,
  deps: Dependencies
): Promise<DeskfyIntegrationConfig> {
  const n = Math.floor(Number(input.lookbackDays));
  if (!Number.isFinite(n) || n < MIN_LOOKBACK || n > MAX_LOOKBACK) {
    throw new Error("O intervalo em dias deve estar entre 0 e 500.");
  }

  const base = input.baseUrl.trim();
  if (!base) {
    throw new Error("Informe a URL base da API Deskfy.");
  }

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new Error("URL base da API Deskfy inválida.");
  }
  if (url.protocol !== "https:") {
    throw new Error("A URL base da API Deskfy deve usar HTTPS.");
  }

  return deps.deskfyConfigRepository.upsertSettings({
    baseUrl: base,
    lookbackDays: n,
  });
}
