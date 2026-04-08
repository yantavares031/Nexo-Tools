import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import { sendSmtpTestMail } from "@/lib/infra/smtp-send-mail";

type Dependencies = { smtpConfigRepository: ISmtpConfigRepository };

export async function sendSmtpTestEmailUseCase(
  to: string,
  deps: Dependencies
): Promise<void> {
  const trimmed = to.trim();
  if (!trimmed) {
    throw new Error("Informe o e-mail de destino do teste.");
  }

  const cfg = await deps.smtpConfigRepository.get();
  if (!cfg?.smtpPassword) {
    throw new Error("Salve a configuração SMTP com usuário e senha antes de testar.");
  }
  if (!cfg.smtpUser.trim()) {
    throw new Error("Usuário SMTP não configurado.");
  }

  await sendSmtpTestMail(cfg, trimmed);
}
