import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import { buildWhatsAppOcAssinadaMessage } from "@/lib/whatsapp-oc-notify-messages";
import { normalizeBrazilWhatsAppNumber } from "@/lib/whatsapp-phone-normalize";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";
import { logUseCaseError } from "@/lib/server-action-log";
import {
  logWhatsAppNotifySkipped,
  logWhatsAppSendAccepted,
} from "@/lib/whatsapp-integration-log";
import type { Demanda } from "@/types/globals";

type Dependencies = {
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
  whatsAppProvider: IWhatsAppProvider;
};

export async function notifyOrdemCompraAssinadaWhatsAppUseCase(
  params: {
    demanda: Demanda;
    assinadoPor: string;
    enviadoPorAgencia?: string;
  },
  deps: Dependencies
): Promise<void> {
  const demandaId = params.demanda.id;
  const row = await deps.whatsAppIntegrationRepository.get();
  if (!row) {
    logWhatsAppNotifySkipped({
      reason: "no_integration_row",
      context: "oc_assinada",
      demandaId,
    });
    return;
  }
  if (!isWhatsAppUazapiPlatform(row.platform)) {
    logWhatsAppNotifySkipped({
      reason: "platform_not_uazapi",
      context: "oc_assinada",
      demandaId,
    });
    return;
  }

  const baseUrl = row.baseUrl.trim();
  const token = row.instanceToken.trim();
  const recipients = row.notifyRecipients ?? [];
  if (!baseUrl || !token) {
    logWhatsAppNotifySkipped({
      reason: "missing_base_url_or_instance_token",
      context: "oc_assinada",
      demandaId,
    });
    return;
  }
  if (recipients.length === 0) {
    logWhatsAppNotifySkipped({
      reason: "no_recipients_configured",
      context: "oc_assinada",
      demandaId,
    });
    return;
  }

  const uniqueNumbers = [
    ...new Set(
      recipients
        .map((r) => normalizeBrazilWhatsAppNumber(r.trim()))
        .filter((n): n is string => Boolean(n))
    ),
  ];
  if (uniqueNumbers.length === 0) {
    logWhatsAppNotifySkipped({
      reason: "recipients_invalid_phone",
      context: "oc_assinada",
      demandaId,
    });
    return;
  }

  const text = buildWhatsAppOcAssinadaMessage({
    demanda: params.demanda,
    assinadoPor: params.assinadoPor,
    enviadoPorAgencia: params.enviadoPorAgencia,
  });

  for (const number of uniqueNumbers) {
    try {
      await deps.whatsAppProvider.sendTextMessage(baseUrl, token, {
        number,
        text,
        async: true,
      });
      logWhatsAppSendAccepted({
        context: "oc_assinada",
        demandaId,
        numberSuffix: number.slice(-4),
        async: true,
      });
    } catch (err) {
      await logUseCaseError("notifyOrdemCompraAssinadaWhatsAppUseCase", err, {
        phase: "send_text",
        demandaId,
        numberSuffix: number.slice(-4),
      });
    }
  }
}
