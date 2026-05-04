import { buildComprovacaoNotificacaoListaEmail } from "@/lib/email/comprovacao-emails";
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
 * Notifica os endereços em "E-mails — notificações de ordem de compra" quando uma agência envia comprovação.
 * Um único envio com todos na lista em To; o usuário da agência entra em Cc se não estiver na lista.
 */
export async function notifyComprovacaoEnviadaEmailsUseCase(
  params: {
    notifyEmails: string[];
    /** E-mail do usuário da agência — Cc no mesmo envio se não estiver na lista. */
    agenciaUserEmail?: string;
    agenciaNome: string;
    demandas: Demanda[];
    nomeArquivo: string;
    fileBuffer: Buffer;
    contentType: string;
    descricao?: string;
  },
  deps: Dependencies
): Promise<void> {
  const cfg = await deps.smtpConfigRepository.get();
  if (!cfg?.enabled || !cfg.smtpPassword?.trim() || !cfg.smtpUser?.trim()) {
    return;
  }

  const lista = uniqueEmails(params.notifyEmails);
  if (lista.length === 0) {
    return;
  }

  const agenciaMail = params.agenciaUserEmail?.trim() ?? "";

  const attachment = {
    filename: params.nomeArquivo || "comprovacao",
    content: params.fileBuffer,
    contentType: params.contentType || "application/octet-stream",
  };

  const listaLower = new Set(lista.map((e) => e.toLowerCase()));
  const ccAgencia =
    agenciaMail && !listaLower.has(agenciaMail.toLowerCase()) ? agenciaMail : undefined;

  try {
    const { subject, html, text } = buildComprovacaoNotificacaoListaEmail({
      agenciaNome: params.agenciaNome,
      demandas: params.demandas,
      nomeArquivo: params.nomeArquivo,
      descricao: params.descricao,
    });
    await sendSmtpMail(cfg, {
      to: lista.join(", "),
      ...(ccAgencia ? { cc: ccAgencia } : {}),
      subject,
      text,
      html,
      attachments: [attachment],
    });
  } catch (err) {
    await logUseCaseError("notifyComprovacaoEnviadaEmailsUseCase", err, {
      recipients: lista.join(", "),
    });
  }
}
