import {
  buildOcEnviadaBackupAgenciaEmail,
  buildOcEnviadaNotificacaoListaEmail,
} from "@/lib/email/ordem-compra-emails";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import { sendSmtpMail } from "@/lib/infra/smtp-send-mail";
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
 * Notifica a lista configurada em SMTP e envia cópia de backup ao usuário da agência.
 * Falhas de envio são logadas no console e não interrompem o fluxo.
 */
export async function notifyOrdemCompraEnviadaEmailsUseCase(
  params: {
    notifyEmails: string[];
    agenciaUserEmail: string;
    agenciaNome: string;
    demanda: Demanda;
    pdfBuffer: Buffer;
    nomeArquivoPdf: string;
  },
  deps: Dependencies
): Promise<void> {
  const cfg = await deps.smtpConfigRepository.get();
  if (!cfg?.enabled || !cfg.smtpPassword?.trim() || !cfg.smtpUser?.trim()) {
    return;
  }

  const lista = uniqueEmails(params.notifyEmails);
  const agenciaMail = params.agenciaUserEmail.trim().toLowerCase();
  const pdf = {
    filename: params.nomeArquivoPdf || "ordem-compra.pdf",
    content: params.pdfBuffer,
    contentType: "application/pdf" as const,
  };

  for (const to of lista) {
    try {
      const { subject, html, text } = buildOcEnviadaNotificacaoListaEmail({
        agenciaNome: params.agenciaNome,
        demanda: params.demanda,
        nomeArquivoPdf: params.nomeArquivoPdf,
      });
      await sendSmtpMail(cfg, { to, subject, text, html, attachments: [pdf] });
    } catch (err) {
      console.error("[OC e-mail] Falha ao notificar lista (OC enviada):", to, err);
    }
  }

  if (agenciaMail) {
    try {
      const { subject, html, text } = buildOcEnviadaBackupAgenciaEmail({
        agenciaNome: params.agenciaNome,
        demanda: params.demanda,
        nomeArquivoPdf: params.nomeArquivoPdf,
      });
      await sendSmtpMail(cfg, {
        to: params.agenciaUserEmail.trim(),
        subject,
        text,
        html,
        attachments: [pdf],
      });
    } catch (err) {
      console.error("[OC e-mail] Falha ao enviar backup à agência:", params.agenciaUserEmail, err);
    }
  }
}
