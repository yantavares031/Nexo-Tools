import { appLogger } from "@/lib/logger";

/** Motivos pelos quais a notificação WhatsApp não foi enviada (diagnóstico no painel de logs). */
export type WhatsAppNotifySkipReason =
  | "no_integration_row"
  | "platform_not_uazapi"
  | "missing_base_url_or_instance_token"
  | "no_recipients_configured"
  | "recipients_invalid_phone";

export type WhatsAppNotifyContext = "oc_enviada" | "oc_assinada" | "comprovacao" | "certidao";

export function logWhatsAppNotifySkipped(params: {
  reason: WhatsAppNotifySkipReason;
  context: WhatsAppNotifyContext;
  /** Id principal para correlação (ex.: demanda; em comprovação multi, primeiro id). */
  demandaId: string;
}): void {
  appLogger.info(
    {
      event: "whatsapp.notify.skipped",
      ...params,
    },
    `WhatsApp (${params.context}): não disparado — ${params.reason}`
  );
}

/**
 * Cada envio aceito pela UAZAPI (`POST /send/text` com async).
 * Paralelo ao `smtp.mail.accepted` para aparecer no mesmo tipo de visão de logs.
 */
export function logWhatsAppSendAccepted(params: {
  context: WhatsAppNotifyContext;
  demandaId: string;
  /** Últimos dígitos do número normalizado (privacidade). */
  numberSuffix: string;
  async: boolean;
}): void {
  appLogger.info(
    {
      event: "whatsapp.send.accepted",
      channel: "whatsapp",
      ...params,
    },
    "WhatsApp: mensagem aceita pelo servidor (envio enfileirado)"
  );
}
