import type {
  IWhatsAppIntegrationRepository,
  WhatsAppCredentialsInput,
} from "@/lib/domain/whatsapp-integration.repository";
import type { WhatsAppInstanceListItem } from "@/types/globals";
import { getWhatsAppProvider } from "@/lib/infra/whatsapp/get-whatsapp-provider";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";

type Dependencies = {
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
};

export async function connectWhatsAppListInstancesUseCase(
  credentials: WhatsAppCredentialsInput,
  deps: Dependencies
): Promise<WhatsAppInstanceListItem[]> {
  const saved = await deps.whatsAppIntegrationRepository.saveCredentials(credentials);

  if (!isWhatsAppUazapiPlatform(saved.platform)) {
    return [];
  }

  const admin = saved.adminToken.trim();
  const baseUrl = saved.baseUrl.trim();

  if (!baseUrl) {
    throw new Error("Informe a URL base da API.");
  }
  if (!admin) {
    throw new Error("Informe o token de administrador para listar instâncias.");
  }

  const provider = getWhatsAppProvider("uazapi");
  const instances = await provider.listInstances(baseUrl, admin);

  return instances.map((i) => ({
    id: i.id,
    name: i.name?.trim() || i.id,
    status: i.status?.trim() || "unknown",
    profileName: i.profileName ?? null,
  }));
}
