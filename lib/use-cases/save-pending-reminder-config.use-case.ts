import type { PendingReminderConfig } from "@/types/globals";
import type {
  IPendingReminderConfigRepository,
  PendingReminderConfigSaveInput,
} from "@/lib/domain/pending-reminder-config.repository";

type Dependencies = { pendingReminderConfigRepository: IPendingReminderConfigRepository };

export const DEFAULT_PENDING_REMINDER_CONFIG: PendingReminderConfig = {
  enabled: false,
  ordemCompraDays: 3,
  comprovacaoDays: 7,
  lastRunAt: null,
  lastRunSummary: null,
};

export async function getPendingReminderConfigUseCase(
  deps: Dependencies
): Promise<PendingReminderConfig> {
  return (await deps.pendingReminderConfigRepository.get()) ?? DEFAULT_PENDING_REMINDER_CONFIG;
}

export async function savePendingReminderConfigUseCase(
  input: PendingReminderConfigSaveInput,
  deps: Dependencies
): Promise<PendingReminderConfig> {
  return deps.pendingReminderConfigRepository.save(input);
}
