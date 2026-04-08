import type { SmtpConfig } from "@/types/globals";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";

type Dependencies = { smtpConfigRepository: ISmtpConfigRepository };

export type SaveSmtpConfigFormInput = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  /** Do formulário: vazio mantém a senha já salva. */
  smtpPassword: string;
  enabled: boolean;
};

export async function saveSmtpConfigUseCase(
  input: SaveSmtpConfigFormInput,
  deps: Dependencies
): Promise<SmtpConfig> {
  const existing = await deps.smtpConfigRepository.get();
  const mergedPassword =
    input.smtpPassword.trim() !== ""
      ? input.smtpPassword.trim()
      : (existing?.smtpPassword ?? "").trim();

  if (input.enabled) {
    if (!input.smtpUser.trim()) {
      throw new Error("Informe o usuário (e-mail) SMTP.");
    }
    if (!mergedPassword) {
      throw new Error("Informe a senha SMTP (ou use senha de app do Gmail).");
    }
  }

  return deps.smtpConfigRepository.save({
    smtpHost: input.smtpHost.trim() || "smtp.gmail.com",
    smtpPort: input.smtpPort,
    smtpUser: input.smtpUser.trim(),
    smtpPassword: mergedPassword,
    enabled: input.enabled,
  });
}
