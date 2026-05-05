import type { DeskfyIntegrationPanel } from "@/types/globals";
import type { IDeskfyConfigRepository } from "@/lib/domain/deskfy-config.repository";

const DEFAULT_BASE = "https://service-api.deskfy.io";
const DEFAULT_LOOKBACK = 30;

type Dependencies = { deskfyConfigRepository: IDeskfyConfigRepository };

function envApiKey(): string {
  return process.env.DESKFY_API_KEY?.trim() ?? "";
}

function envBaseUrl(): string {
  return process.env.DESKFY_BASE_URL?.trim() ?? "";
}

export async function getDeskfyIntegrationPanelUseCase(
  deps: Dependencies
): Promise<DeskfyIntegrationPanel> {
  const row = await deps.deskfyConfigRepository.get();

  const baseUrl = row?.baseUrl?.trim() || envBaseUrl() || DEFAULT_BASE;
  const lookbackDays = row != null ? row.lookbackDays : DEFAULT_LOOKBACK;
  const hasApiKey = !!(row?.apiKey?.trim()) || !!envApiKey();

  return {
    baseUrl,
    lookbackDays,
    hasApiKey,
  };
}
