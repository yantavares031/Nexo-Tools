import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";

type Dependencies = { whatsAppIntegrationRepository: IWhatsAppIntegrationRepository };

export async function saveWhatsAppNotifyRecipientsUseCase(
  recipients: string[],
  deps: Dependencies
): Promise<void> {
  await deps.whatsAppIntegrationRepository.saveNotifyRecipients(recipients);
}
