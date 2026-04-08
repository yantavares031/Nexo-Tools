import type { SmtpConfig } from "@/types/globals";

/** Valores finais já mesclados (senha nova ou a existente). */
export type SmtpConfigPersistInput = Pick<
  SmtpConfig,
  "smtpHost" | "smtpPort" | "smtpUser" | "smtpPassword" | "enabled"
>;

export interface ISmtpConfigRepository {
  get(): Promise<SmtpConfig | null>;
  save(input: SmtpConfigPersistInput): Promise<SmtpConfig>;
}
