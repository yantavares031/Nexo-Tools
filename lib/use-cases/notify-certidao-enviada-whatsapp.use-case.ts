import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import { buildWhatsAppCertidaoMessage } from "@/lib/whatsapp-oc-notify-messages";
import { normalizeBrazilWhatsAppNumber } from "@/lib/whatsapp-phone-normalize";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";
import { logUseCaseError } from "@/lib/server-action-log";
import {
  logWhatsAppNotifySkipped,
  logWhatsAppSendAccepted,
} from "@/lib/whatsapp-integration-log";

type Dependencies = {
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
  whatsAppProvider: IWhatsAppProvider;
};

export async function notifyCertidaoEnviadaWhatsAppUseCase(
  params: {
    nomesArquivos: string[];
    enviadoPorUsuario: string;
    descricao?: string;
    /** Id da primeira certidão do lote (correlação em logs). */
    refId?: string;
  },
  deps: Dependencies
): Promise<void> {
  const refId = params.refId ?? "—";
  const row = await deps.whatsAppIntegrationRepository.get();
  if (!row) {
    logWhatsAppNotifySkipped({
      reason: "no_integration_row",
      context: "certidao",
      demandaId: refId,
    });
    return;
  }
  if (!isWhatsAppUazapiPlatform(row.platform)) {
    logWhatsAppNotifySkipped({
      reason: "platform_not_uazapi",
      context: "certidao",
      demandaId: refId,
    });
    return;
  }

  const baseUrl = row.baseUrl.trim();
  const token = row.instanceToken.trim();
  const recipients = row.notifyRecipients ?? [];
  if (!baseUrl || !token) {
    logWhatsAppNotifySkipped({
      reason: "missing_base_url_or_instance_token",
      context: "certidao",
      demandaId: refId,
    });
    return;
  }
  if (recipients.length === 0) {
    logWhatsAppNotifySkipped({
      reason: "no_recipients_configured",
      context: "certidao",
      demandaId: refId,
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
      context: "certidao",
      demandaId: refId,
    });
    return;
  }

  const text = buildWhatsAppCertidaoMessage({
    nomesArquivos: params.nomesArquivos,
    enviadoPorUsuario: params.enviadoPorUsuario,
    descricao: params.descricao,
  });

  for (const number of uniqueNumbers) {
    try {
      await deps.whatsAppProvider.sendTextMessage(baseUrl, token, {
        number,
        text,
        async: true,
      });
      logWhatsAppSendAccepted({
        context: "certidao",
        demandaId: refId,
        numberSuffix: number.slice(-4),
        async: true,
      });
    } catch (err) {
      await logUseCaseError("notifyCertidaoEnviadaWhatsAppUseCase", err, {
        phase: "send_text",
        refId,
        numberSuffix: number.slice(-4),
      });
    }
  }
}
