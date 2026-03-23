import type {
  DeskfyWorkflowReportQuery,
  IDeskfyWorkflowReportsService,
} from "@/lib/domain/deskfy-workflow-reports.service";
import type { DeskfyWorkflowReportItem } from "@/types/globals";

type Dependencies = {
  deskfyWorkflowReportsService: IDeskfyWorkflowReportsService;
};

/** Caso de uso: consultar a Deskfy pelo endpoint de relatórios de workflow. */
export async function getDeskfyWorkflowReportUseCase(
  query: DeskfyWorkflowReportQuery,
  deps: Dependencies
): Promise<DeskfyWorkflowReportItem[]> {
  const initialDate = query.initialDate?.trim();
  const endDate = query.endDate?.trim();

  if (!initialDate || !endDate) {
    throw new Error("Informe `initialDate` e `endDate` para a consulta do relatório.");
  }

  return deps.deskfyWorkflowReportsService.getWorkflowReport({
    ...query,
    initialDate,
    endDate,
  });
}

