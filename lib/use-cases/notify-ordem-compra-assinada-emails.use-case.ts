import {
  buildOcAssinadaAgenciaEmail,
  buildOcAssinadaNotificacaoListaEmail,
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
 * Após registrar a OC assinada: avisa a agência (link no painel) e a lista SMTP (PDF assinado anexo).
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

  const enviadoPor = params.enviadoPorEmail?.trim() ?? "";
  const agenciaNotificada = Boolean(enviadoPor);

  if (enviadoPor) {
    try {
      const { subject, html, text } = buildOcAssinadaAgenciaEmail({
        agenciaNome: params.agenciaNome,
        demanda: params.demanda,
        ordensCompraUrl: params.ordensCompraUrl,
      });
      await sendSmtpMail(cfg, { to: enviadoPor, subject, text, html });
    } catch (err) {
      console.error("[OC e-mail] Falha ao notificar agência (OC assinada):", enviadoPor, err);
    }
  }

  const lista = uniqueEmails(params.notifyEmails);
  const pdf = {
    filename: params.nomeArquivoPdfAssinado || "oc-assinada.pdf",
    content: params.signedPdfBuffer,
    contentType: "application/pdf" as const,
  };

  for (const to of lista) {
    try {
      const { subject, html, text } = buildOcAssinadaNotificacaoListaEmail({
        agenciaNome: params.agenciaNome,
        demanda: params.demanda,
        nomeArquivoPdfAssinado: params.nomeArquivoPdfAssinado,
        agenciaNotificada,
      });
      await sendSmtpMail(cfg, { to, subject, text, html, attachments: [pdf] });
    } catch (err) {
      console.error("[OC e-mail] Falha ao notificar lista (OC assinada):", to, err);
    }
  }
}
