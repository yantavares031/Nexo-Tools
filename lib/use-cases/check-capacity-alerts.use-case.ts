import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import type { ICapacityAlertRepository } from "@/lib/domain/capacity-alert.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import { buildWhatsAppCapacityAlertMessage } from "@/lib/whatsapp-capacity-alert-message";
import { normalizeBrazilWhatsAppNumber } from "@/lib/whatsapp-phone-normalize";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";
import { logWhatsAppNotifySkipped, logWhatsAppSendAccepted } from "@/lib/whatsapp-integration-log";
import { logUseCaseError, logUseCaseInfo } from "@/lib/server-action-log";
import { currentCapacityYear, getDashboardAgenciasUseCase } from "./get-dashboard-agencias.use-case";

export type CapacityAlertsDeps = {
  capacityAlertRepository: ICapacityAlertRepository;
  demandaRepository: IDemandaRepository;
  agenciaRepository: IAgenciaRepository;
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
  whatsAppProvider: IWhatsAppProvider;
  now?: Date;
};

export type CapacityAlertsResult = {
  skipped?: string;
  alertasEnviados: number;
  falhas: number;
};

async function resolveWhatsAppTarget(
  deps: CapacityAlertsDeps
): Promise<{ baseUrl: string; token: string; numbers: string[] } | null> {
  const row = await deps.whatsAppIntegrationRepository.get();
  const skip = (reason: Parameters<typeof logWhatsAppNotifySkipped>[0]["reason"]) => {
    logWhatsAppNotifySkipped({ reason, context: "capacidade" });
    return null;
  };
  if (!row) return skip("no_integration_row");
  if (!isWhatsAppUazapiPlatform(row.platform)) return skip("platform_not_uazapi");
  const baseUrl = row.baseUrl.trim();
  const token = row.instanceToken.trim();
  if (!baseUrl || !token) return skip("missing_base_url_or_instance_token");
  const recipients = row.notifyRecipients ?? [];
  if (recipients.length === 0) return skip("no_recipients_configured");
  const numbers = [
    ...new Set(
      recipients
        .map((r) => normalizeBrazilWhatsAppNumber(r.trim()))
        .filter((n): n is string => Boolean(n))
    ),
  ];
  if (numbers.length === 0) return skip("recipients_invalid_phone");
  return { baseUrl, token, numbers };
}

async function runCapacityAlerts(deps: CapacityAlertsDeps): Promise<CapacityAlertsResult> {
  const result: CapacityAlertsResult = { alertasEnviados: 0, falhas: 0 };

  const config = await deps.capacityAlertRepository.getConfig();
  if (!config?.enabled) return { ...result, skipped: "Alertas de capacidade desativados." };
  const thresholds = [...config.thresholds].sort((a, b) => a - b);
  if (thresholds.length === 0) return { ...result, skipped: "Nenhum limite configurado." };

  const year = currentCapacityYear(deps.now ?? new Date());
  const [agencias, sent] = await Promise.all([
    getDashboardAgenciasUseCase({ year }, {
      demandaRepository: deps.demandaRepository,
      agenciaRepository: deps.agenciaRepository,
    }),
    deps.capacityAlertRepository.listSent(year),
  ]);
  const sentKeys = new Set(sent.map((s) => `${s.agenciaId}:${s.threshold}`));

  const pendentes = agencias.flatMap(({ agencia, faturado }) => {
    const capacidade = agencia.orcamentoAnual;
    if (!capacidade || capacidade <= 0) return [];
    const percentual = (faturado / capacidade) * 100;
    const novos = thresholds.filter((t) => percentual >= t && !sentKeys.has(`${agencia.id}:${t}`));
    return novos.length > 0 ? [{ agencia, faturado, capacidade, percentual, novos }] : [];
  });
  if (pendentes.length === 0) return result;

  const target = await resolveWhatsAppTarget(deps);
  if (!target) return { ...result, skipped: "WhatsApp não configurado para notificações." };

  for (const { agencia, faturado, capacidade, percentual, novos } of pendentes) {
    // Se a agência cruzou vários limites de uma vez, avisa só o maior e marca todos como enviados.
    const threshold = novos[novos.length - 1];
    const text = buildWhatsAppCapacityAlertMessage({
      agenciaNome: agencia.nomeFantasia,
      threshold,
      percentual,
      faturado,
      capacidadeAnual: capacidade,
    });

    let entregues = 0;
    for (const number of target.numbers) {
      try {
        await deps.whatsAppProvider.sendTextMessage(target.baseUrl, target.token, { number, text, async: true });
        entregues++;
        logWhatsAppSendAccepted({
          context: "capacidade",
          agenciaId: agencia.id,
          numberSuffix: number.slice(-4),
          async: true,
        });
      } catch (err) {
        result.falhas++;
        await logUseCaseError("checkCapacityAlertsUseCase", err, {
          phase: "send_text",
          agenciaId: agencia.id,
          numberSuffix: number.slice(-4),
        });
      }
    }

    // Sem nenhuma entrega, não registra: o alerta é tentado de novo na próxima alteração.
    if (entregues === 0) continue;
    for (const t of novos) {
      await deps.capacityAlertRepository.registerSent({ agenciaId: agencia.id, year, threshold: t, percentual });
    }
    result.alertasEnviados++;
  }

  await logUseCaseInfo("checkCapacityAlertsUseCase", "Alertas de capacidade processados", { ...result, year });
  return result;
}

/**
 * Verifica o uso da capacidade anual (faturado no ano ÷ orçamento anual, como no Dashboard) e avisa por WhatsApp
 * quando uma agência cruza um limite configurado. Cada limite dispara uma vez por agência no ano.
 * Nunca lança: falhas só geram log, para não bloquear a operação que disparou a verificação.
 */
export async function checkCapacityAlertsUseCase(deps: CapacityAlertsDeps): Promise<CapacityAlertsResult> {
  try {
    return await runCapacityAlerts(deps);
  } catch (err) {
    await logUseCaseError("checkCapacityAlertsUseCase", err);
    return { alertasEnviados: 0, falhas: 0, skipped: "Não foi possível verificar a capacidade das agências." };
  }
}
