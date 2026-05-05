import type { IDeskfyConfigRepository } from "@/lib/domain/deskfy-config.repository";
import { getDeskfyWorkflowDateRangeFromLookbackDays } from "@/lib/deskfy/deskfy-workflow-date";

const DEFAULT_LOOKBACK = 30;

type Dependencies = { deskfyConfigRepository: IDeskfyConfigRepository };

/**
 * Intervalo de datas do relatório de importação, conforme lookback salvo (ou padrão).
 * Mantém o fim em "amanhã" como no comportamento legado.
 */
export async function getDeskfyWorkflowImportDateRangeUseCase(
  deps: Dependencies
): Promise<{ initialDate: string; endDate: string; lookbackDays: number }> {
  const row = await deps.deskfyConfigRepository.get();
  const lookbackDays = row != null ? row.lookbackDays : DEFAULT_LOOKBACK;
  const { initialDate, endDate } = getDeskfyWorkflowDateRangeFromLookbackDays(lookbackDays);
  return { initialDate, endDate, lookbackDays };
}
