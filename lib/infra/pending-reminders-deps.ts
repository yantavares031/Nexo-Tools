import {
  getAgenciaRepository,
  getDemandaRepository,
  getOrdemCompraRepository,
  getPendingReminderConfigRepository,
  getSmtpConfigRepository,
  getUserRepository,
} from "@/lib/repositories";
import { getPublicAppBaseUrlForEmail } from "@/lib/public-app-url";

/** Dependências concretas do envio de lembretes (usadas pela action manual e pelo script de cron). */
export function makePendingRemindersDeps() {
  return {
    pendingReminderConfigRepository: getPendingReminderConfigRepository(),
    smtpConfigRepository: getSmtpConfigRepository(),
    ordemCompraRepository: getOrdemCompraRepository(),
    demandaRepository: getDemandaRepository(),
    userRepository: getUserRepository(),
    agenciaRepository: getAgenciaRepository(),
    appBaseUrl: getPublicAppBaseUrlForEmail(),
  };
}
