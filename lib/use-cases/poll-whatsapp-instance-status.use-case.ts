import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import type { WhatsAppInstanceStatusPayload } from "@/types/globals";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";

type Dependencies = {
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
  whatsAppProvider: IWhatsAppProvider;
};

export async function pollWhatsAppInstanceStatusUseCase(
  deps: Dependencies
): Promise<WhatsAppInstanceStatusPayload> {
  const cfg = await deps.whatsAppIntegrationRepository.get();
  const baseUrl = cfg?.baseUrl?.trim() ?? "";
  const token = cfg?.instanceToken?.trim() ?? "";

  if (!cfg || !isWhatsAppUazapiPlatform(cfg.platform)) {
    return {
      instanceId: null,
      name: null,
      status: null,
      profileName: null,
      paircode: null,
      qrcode: null,
      lastDisconnectReason: null,
      apiConnected: false,
      apiLoggedIn: false,
    };
  }

  if (!cfg?.selectedInstanceId?.trim() || !token || !baseUrl) {
    return {
      instanceId: null,
      name: null,
      status: null,
      profileName: null,
      paircode: null,
      qrcode: null,
      lastDisconnectReason: null,
      apiConnected: false,
      apiLoggedIn: false,
    };
  }

  const result = await deps.whatsAppProvider.getInstanceStatus(baseUrl, token);
  const inst = result.instance;

  return {
    instanceId: inst.id || cfg.selectedInstanceId,
    name: inst.name ?? cfg.instanceName,
    status: inst.status ?? cfg.instanceStatus,
    profileName: inst.profileName ?? cfg.profileName,
    paircode: inst.paircode ?? null,
    qrcode: inst.qrcode ?? null,
    lastDisconnectReason:
      typeof inst.raw.lastDisconnectReason === "string"
        ? inst.raw.lastDisconnectReason
        : null,
    apiConnected: Boolean(result.statusBlock?.connected),
    apiLoggedIn: Boolean(result.statusBlock?.loggedIn),
  };
}
