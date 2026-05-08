import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { WhatsAppIntegrationPanel } from "@/types/globals";
import { parseWhatsAppProviderFieldsJson } from "@/lib/whatsapp-provider-fields";

type Dependencies = { whatsAppIntegrationRepository: IWhatsAppIntegrationRepository };

function summarizeBusinessProfileJson(json: string | null): string | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as {
      response?: { tag?: string; description?: string; email?: string };
    };
    const r = parsed.response;
    if (!r) return null;
    const parts = [r.tag, r.description, r.email].filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
    const text = parts.join(" — ").trim();
    return text.length > 0 ? text.slice(0, 400) : null;
  } catch {
    return null;
  }
}

export async function getWhatsAppIntegrationPanelUseCase(
  deps: Dependencies
): Promise<WhatsAppIntegrationPanel> {
  const row = await deps.whatsAppIntegrationRepository.get();
  const platform = row?.platform?.trim() || "uazapi";
  const baseUrl = row?.baseUrl?.trim() ?? "";
  const pf = parseWhatsAppProviderFieldsJson(row?.providerFieldsJson ?? null);

  const profilePicSrc = row?.profilePicStorageKey?.trim()
    ? "/api/integrations/whatsapp/instance-photo"
    : row?.profilePicUrl?.trim() || null;

  return {
    platform,
    baseUrl,
    zapiInstanceId: pf.zapiInstanceId,
    evolutionInstanceName: pf.evolutionInstanceName,
    hasAdminToken: Boolean(row?.adminToken?.trim()),
    hasApiToken: Boolean(row?.apiToken?.trim()),
    hasInstanceToken: Boolean(row?.instanceToken?.trim()),
    selectedInstanceId: row?.selectedInstanceId ?? null,
    instanceName: row?.instanceName ?? null,
    instanceStatus: row?.instanceStatus ?? null,
    profileName: row?.profileName ?? null,
    profilePicSrc,
    businessProfileSummary: summarizeBusinessProfileJson(row?.businessProfileJson ?? null),
    notifyRecipients: row?.notifyRecipients ?? [],
    asyncMsgDelayMin: row?.asyncMsgDelayMin ?? 3,
    asyncMsgDelayMax: row?.asyncMsgDelayMax ?? 5,
  };
}
