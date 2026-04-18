import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import { buildNewUserCredentialsEmail } from "@/lib/email/new-user-credentials-email";
import { sendSmtpMail } from "@/lib/infra/smtp-send-mail";

type Dependencies = { smtpConfigRepository: ISmtpConfigRepository };

export type SendNewUserCredentialsEmailResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "smtp_not_configured" }
  | { status: "failed"; message: string };

/**
 * Envia ao novo usuário o e-mail com login e senha temporária.
 * Se SMTP não estiver configurado, não falha o cadastro — retorna skipped.
 */
export async function sendNewUserCredentialsEmailUseCase(
  params: {
    to: string;
    recipientName?: string;
    loginEmail: string;
    temporaryPassword: string;
    loginPageUrl: string;
  },
  deps: Dependencies
): Promise<SendNewUserCredentialsEmailResult> {
  const cfg = await deps.smtpConfigRepository.get();
  if (!cfg?.smtpPassword || !cfg.smtpUser?.trim()) {
    return { status: "skipped", reason: "smtp_not_configured" };
  }

  const { html, text } = buildNewUserCredentialsEmail({
    recipientName: params.recipientName,
    loginEmail: params.loginEmail,
    temporaryPassword: params.temporaryPassword,
    loginPageUrl: params.loginPageUrl,
  });

  try {
    await sendSmtpMail(cfg, {
      to: params.to.trim(),
      subject: "NEXO Tools — seu acesso (senha temporária)",
      text,
      html,
    });
    return { status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao enviar e-mail.";
    return { status: "failed", message };
  }
}
