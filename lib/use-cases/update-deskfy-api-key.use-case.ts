import type { DeskfyIntegrationConfig } from "@/types/globals";
import type { IDeskfyConfigRepository } from "@/lib/domain/deskfy-config.repository";

type Dependencies = { deskfyConfigRepository: IDeskfyConfigRepository };

export async function updateDeskfyApiKeyUseCase(
  apiKey: string,
  deps: Dependencies
): Promise<DeskfyIntegrationConfig> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("Informe a chave API da Deskfy.");
  }

  return deps.deskfyConfigRepository.setApiKey(key);
}
