import {
  getAgenciaRepository,
  getCapacityAlertRepository,
  getDemandaRepository,
  getWhatsAppIntegrationRepository,
} from "@/lib/repositories";
import { getWhatsAppProvider } from "@/lib/infra/whatsapp/get-whatsapp-provider";
import type { CapacityAlertsDeps } from "@/lib/use-cases/check-capacity-alerts.use-case";

/** Dependências concretas da verificação de capacidade (chamada após mudanças em demandas e agências). */
export function makeCapacityAlertsDeps(): CapacityAlertsDeps {
  return {
    capacityAlertRepository: getCapacityAlertRepository(),
    demandaRepository: getDemandaRepository(),
    agenciaRepository: getAgenciaRepository(),
    whatsAppIntegrationRepository: getWhatsAppIntegrationRepository(),
    whatsAppProvider: getWhatsAppProvider("uazapi"),
  };
}
