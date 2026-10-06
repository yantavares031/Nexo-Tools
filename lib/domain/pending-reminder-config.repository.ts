import type { PendingReminderConfig } from "@/types/globals";

export type PendingReminderConfigSaveInput = Pick<
  PendingReminderConfig,
  "enabled" | "ordemCompraDays" | "comprovacaoDays"
>;

export interface IPendingReminderConfigRepository {
  get(): Promise<PendingReminderConfig | null>;
  save(input: PendingReminderConfigSaveInput): Promise<PendingReminderConfig>;
  registerRun(summary: string): Promise<void>;
}
