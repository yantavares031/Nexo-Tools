import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import { deleteAppObjectFromR2, isR2AppObjectKey } from "@/lib/r2-upload";

type Dependencies = { whatsAppIntegrationRepository: IWhatsAppIntegrationRepository };

export async function disconnectWhatsAppIntegrationUseCase(deps: Dependencies): Promise<void> {
  const cfg = await deps.whatsAppIntegrationRepository.get();
  const key = cfg?.profilePicStorageKey?.trim();
  if (key && isR2AppObjectKey(key)) {
    await deleteAppObjectFromR2(key).catch(() => {});
  }
  await deps.whatsAppIntegrationRepository.clearConnectedInstance();
}
