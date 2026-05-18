import { buildCertidaoNotificacaoListaEmail } from "@/lib/email/certidao-emails";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import { sendSmtpMail } from "@/lib/infra/smtp-send-mail";
import { logUseCaseError } from "@/lib/server-action-log";

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
 * Notifica os endereços em "E-mails — notificações de ordem de compra" ao cadastrar certidão.
 * Mesma lista usada por OC e comprovações (Integrações).
 */
export async function notifyCertidaoEnviadaEmailsUseCase(
  params: {
    notifyEmails: string[];
    agenciaUserEmail?: string;
    origemNome: string;
    nomeArquivo: string;
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
  const listaLower = new Set(lista.map((e) => e.toLowerCase()));
  const ccAgencia =
    agenciaMail && !listaLower.has(agenciaMail.toLowerCase()) ? agenciaMail : undefined;

  try {
    const { subject, html, text } = buildCertidaoNotificacaoListaEmail({
      origemNome: params.origemNome,
      nomeArquivo: params.nomeArquivo,
      descricao: params.descricao,
    });
    await sendSmtpMail(cfg, {
      to: lista.join(", "),
      ...(ccAgencia ? { cc: ccAgencia } : {}),
      subject,
      text,
      html,
    });
  } catch (err) {
    await logUseCaseError("notifyCertidaoEnviadaEmailsUseCase", err, {
      recipients: lista.join(", "),
    });
  }
}
