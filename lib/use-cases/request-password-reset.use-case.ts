import type { IUserRepository } from "@/lib/domain/user.repository";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import type { SmtpConfig } from "@/types/globals";
import type { IPasswordResetTokenService } from "@/lib/contracts/password-reset-token";
import { buildPasswordResetEmail } from "@/lib/email/password-reset-email";

export const PASSWORD_RESET_EXPIRES_MINUTES = 60;

type MailMessage = { to: string; subject: string; text: string; html: string };

type Dependencies = {
  userRepository: IUserRepository;
  smtpConfigRepository: ISmtpConfigRepository;
  tokenService: IPasswordResetTokenService;
  sendMail: (config: SmtpConfig, message: MailMessage) => Promise<void>;
};

export type RequestPasswordResetResult =
  | { status: "sent" }
  | { status: "ignored" }
  | { status: "smtp_not_configured" };

/**
 * "Esqueci minha senha": envia o link de redefinição por e-mail.
 * E-mail inexistente ou usuário bloqueado retornam `ignored` — a action responde igual nos dois casos
 * para não revelar quais e-mails têm conta.
 */
export async function requestPasswordResetUseCase(
  input: { email: string; resetPageUrl: string; now: Date },
  deps: Dependencies
): Promise<RequestPasswordResetResult> {
  const user = await deps.userRepository.findByEmail(input.email.trim().toLowerCase());
  if (!user || user.acesso === false) return { status: "ignored" };

  const smtp = await deps.smtpConfigRepository.get();
  if (!smtp?.smtpPassword || !smtp.smtpUser?.trim()) return { status: "smtp_not_configured" };

  const expiresAt = new Date(input.now.getTime() + PASSWORD_RESET_EXPIRES_MINUTES * 60_000);
  const token = deps.tokenService.create({ userId: user.id, passwordHash: user.password }, expiresAt);
  const resetUrl = `${input.resetPageUrl}?token=${encodeURIComponent(token)}`;

  const { html, text } = buildPasswordResetEmail({
    recipientName: user.name,
    resetUrl,
    expiresInMinutes: PASSWORD_RESET_EXPIRES_MINUTES,
  });

  await deps.sendMail(smtp, {
    to: user.email,
    subject: "NEXO Tools — redefinir senha",
    text,
    html,
  });

  return { status: "sent" };
}
