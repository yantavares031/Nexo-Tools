import type { CapacityAlertConfig, CapacityAlertSent } from "@/types/globals";

export type CapacityAlertConfigSaveInput = Pick<CapacityAlertConfig, "enabled" | "thresholds">;

export type CapacityAlertSentInput = Pick<CapacityAlertSent, "agenciaId" | "year" | "threshold" | "percentual">;

export interface ICapacityAlertRepository {
  getConfig(): Promise<CapacityAlertConfig | null>;
  saveConfig(input: CapacityAlertConfigSaveInput): Promise<CapacityAlertConfig>;
  listSent(year: number): Promise<CapacityAlertSent[]>;
  /** Ignora silenciosamente se o limite já foi registrado para a agência no ano. */
  registerSent(input: CapacityAlertSentInput): Promise<void>;
}
