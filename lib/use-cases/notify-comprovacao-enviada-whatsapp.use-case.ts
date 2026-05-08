import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import { buildWhatsAppComprovacaoMessage } from "@/lib/whatsapp-oc-notify-messages";
import { normalizeBrazilWhatsAppNumber } from "@/lib/whatsapp-phone-normalize";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";
import { logUseCaseError } from "@/lib/server-action-log";
import type { Demanda } from "@/types/globals";
import {
  logWhatsAppNotifySkipped,
  logWhatsAppSendAccepted,
} from "@/lib/whatsapp-integration-log";

type Dependencies = {
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
  whatsAppProvider: IWhatsAppProvider;
};

export async function notifyComprovacaoEnviadaWhatsAppUseCase(
  params: {
    demandas: Demanda[];
    /** Nome do usuário que enviou (sessão), não a agência. */
    enviadoPorUsuario: string;
    descricao?: string;
  },
  deps: Dependencies
): Promise<void> {
  const demandaIdRef = params.demandas[0]?.id ?? "—";
  const row = await deps.whatsAppIntegrationRepository.get();
  if (!row) {
    logWhatsAppNotifySkipped({
      reason: "no_integration_row",
      context: "comprovacao",
      demandaId: demandaIdRef,
    });
    return;
  }
  if (!isWhatsAppUazapiPlatform(row.platform)) {
    logWhatsAppNotifySkipped({
      reason: "platform_not_uazapi",
      context: "comprovacao",
      demandaId: demandaIdRef,
    });
    return;
  }

  const baseUrl = row.baseUrl.trim();
  const token = row.instanceToken.trim();
  const recipients = row.notifyRecipients ?? [];
  if (!baseUrl || !token) {
    logWhatsAppNotifySkipped({
      reason: "missing_base_url_or_instance_token",
      context: "comprovacao",
      demandaId: demandaIdRef,
    });
    return;
  }
  if (recipients.length === 0) {
    logWhatsAppNotifySkipped({
      reason: "no_recipients_configured",
      context: "comprovacao",
      demandaId: demandaIdRef,
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
      context: "comprovacao",
      demandaId: demandaIdRef,
    });
    return;
  }

  const text = buildWhatsAppComprovacaoMessage({
    demandas: params.demandas,
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
        context: "comprovacao",
        demandaId: demandaIdRef,
        numberSuffix: number.slice(-4),
        async: true,
      });
    } catch (err) {
      await logUseCaseError("notifyComprovacaoEnviadaWhatsAppUseCase", err, {
        phase: "send_text",
        demandaIds: params.demandas.map((d) => d.id),
        numberSuffix: number.slice(-4),
      });
    }
  }
}
