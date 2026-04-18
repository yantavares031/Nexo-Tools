import type { SmtpConfig, SmtpConfigPanel } from "@/types/globals";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";

type Dependencies = { smtpConfigRepository: ISmtpConfigRepository };

export function smtpConfigToPanel(row: SmtpConfig | null): SmtpConfigPanel {
  if (!row) {
    return {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "",
      enabled: false,
      hasPassword: false,
      ordemCompraNotifyEmailsText: "",
    };
  }
  const lines = row.ordemCompraNotifyEmails?.length
    ? row.ordemCompraNotifyEmails.join("\n")
    : "";
  return {
    smtpHost: row.smtpHost || "smtp.gmail.com",
    smtpPort: row.smtpPort,
    smtpUser: row.smtpUser,
    enabled: row.enabled,
    hasPassword: row.smtpPassword.length > 0,
    ordemCompraNotifyEmailsText: lines,
  };
}

export async function getSmtpConfigPanelUseCase(
  deps: Dependencies
): Promise<SmtpConfigPanel> {
  const row = await deps.smtpConfigRepository.get();
  return smtpConfigToPanel(row);
}
