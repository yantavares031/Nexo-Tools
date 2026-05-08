import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";

type Dependencies = {
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
  whatsAppProvider: IWhatsAppProvider;
};

export async function saveWhatsAppAsyncDelaySettingsUseCase(
  params: { msgDelayMin: number; msgDelayMax: number },
  deps: Dependencies
): Promise<void> {
  let min = Math.max(0, Math.trunc(params.msgDelayMin));
  let max = Math.max(0, Math.trunc(params.msgDelayMax));
  if (max < min) max = min;

  await deps.whatsAppIntegrationRepository.saveAsyncDelaySettings(min, max);

  const row = await deps.whatsAppIntegrationRepository.get();
  if (!row) return;
  if (!isWhatsAppUazapiPlatform(row.platform)) return;

  const baseUrl = row.baseUrl.trim();
  const token = row.instanceToken.trim();
  if (!baseUrl || !token) return;

  await deps.whatsAppProvider.updateInstanceDelaySettings(baseUrl, token, min, max);
}
