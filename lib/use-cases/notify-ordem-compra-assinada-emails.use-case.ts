import {
  buildOcAssinadaAgenciaEmail,
  buildOcAssinadaNotificacaoListaEmail,
} from "@/lib/email/ordem-compra-emails";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import { sendSmtpMail } from "@/lib/infra/smtp-send-mail";
import { logUseCaseError } from "@/lib/server-action-log";
import type { Demanda } from "@/types/globals";

type Dependencies = { smtpConfigRepository: ISmtpConfigRepository };

function uniqueEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of emails) {
    const e = raw.trim().toLowerCase();
    if (!e || seen.has(e)) continue;
    seen.add(e);
    out.push(raw.trim());
  }
  return out;
}

/**
 * Após registrar a OC assinada: um único e-mail com PDF anexo — destinatários To =
 * quem enviou a OC + lista "notificações OC" (sem duplicar). Sem remetente: só a lista, um único envio.
 */
export async function notifyOrdemCompraAssinadaEmailsUseCase(
  params: {
    notifyEmails: string[];
    agenciaNome: string;
    demanda: Demanda;
    enviadoPorEmail?: string;
    ordensCompraUrl: string;
    signedPdfBuffer: Buffer;
    nomeArquivoPdfAssinado: string;
  },
  deps: Dependencies
): Promise<void> {
  const cfg = await deps.smtpConfigRepository.get();
  if (!cfg?.enabled || !cfg.smtpPassword?.trim() || !cfg.smtpUser?.trim()) {
    return;
  }

  const lista = uniqueEmails(params.notifyEmails);
  const pdf = {
    filename: params.nomeArquivoPdfAssinado || "oc-assinada.pdf",
    content: params.signedPdfBuffer,
    contentType: "application/pdf" as const,
  };

  const enviadoPor = params.enviadoPorEmail?.trim() ?? "";

  if (enviadoPor) {
    const todosDestinatarios = uniqueEmails([enviadoPor, ...lista]);
    try {
      const { subject, html, text } = buildOcAssinadaAgenciaEmail({
        agenciaNome: params.agenciaNome,
        demanda: params.demanda,
        ordensCompraUrl: params.ordensCompraUrl,
        nomeArquivoPdfAssinado: params.nomeArquivoPdfAssinado,
      });
      await sendSmtpMail(cfg, {
        to: todosDestinatarios.join(", "),
        subject,
        text,
        html,
        attachments: [pdf],
      });
    } catch (err) {
      await logUseCaseError("notifyOrdemCompraAssinadaEmailsUseCase", err, {
        phase: "assinada_enviado_por",
        recipients: todosDestinatarios.join(", "),
      });
    }
    return;
  }

  const agenciaNotificada = false;
  if (lista.length === 0) {
    return;
  }
  try {
    const { subject, html, text } = buildOcAssinadaNotificacaoListaEmail({
      agenciaNome: params.agenciaNome,
      demanda: params.demanda,
      nomeArquivoPdfAssinado: params.nomeArquivoPdfAssinado,
      agenciaNotificada,
    });
    await sendSmtpMail(cfg, {
      to: lista.join(", "),
      subject,
      text,
      html,
      attachments: [pdf],
    });
  } catch (err) {
    await logUseCaseError("notifyOrdemCompraAssinadaEmailsUseCase", err, {
      phase: "assinada_lista_only",
      recipients: lista.join(", "),
    });
  }
}
