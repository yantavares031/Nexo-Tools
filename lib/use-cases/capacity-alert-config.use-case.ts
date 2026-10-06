import type { CapacityAlertConfig, CapacityAlertSent } from "@/types/globals";
import type {
  CapacityAlertConfigSaveInput,
  ICapacityAlertRepository,
} from "@/lib/domain/capacity-alert.repository";
import { currentCapacityYear } from "./get-dashboard-agencias.use-case";

type Dependencies = { capacityAlertRepository: ICapacityAlertRepository; now?: Date };

export const DEFAULT_CAPACITY_ALERT_CONFIG: CapacityAlertConfig = {
  enabled: false,
  thresholds: [80, 100],
};

export type CapacityAlertPanel = {
  config: CapacityAlertConfig;
  year: number;
  sent: CapacityAlertSent[];
};

export async function getCapacityAlertPanelUseCase(deps: Dependencies): Promise<CapacityAlertPanel> {
  const year = currentCapacityYear(deps.now ?? new Date());
  const [config, sent] = await Promise.all([
    deps.capacityAlertRepository.getConfig(),
    deps.capacityAlertRepository.listSent(year),
  ]);
  return { config: config ?? DEFAULT_CAPACITY_ALERT_CONFIG, year, sent };
}

export async function saveCapacityAlertConfigUseCase(
  input: CapacityAlertConfigSaveInput,
  deps: Dependencies
): Promise<CapacityAlertConfig> {
  const thresholds = [...new Set(input.thresholds)].sort((a, b) => a - b);
  if (input.enabled && thresholds.length === 0) {
    throw new Error("Informe ao menos um limite para ativar os alertas.");
  }
  return deps.capacityAlertRepository.saveConfig({ enabled: input.enabled, thresholds });
}
