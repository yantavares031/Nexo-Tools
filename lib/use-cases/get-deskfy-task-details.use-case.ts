import type { IDeskfyWorkflowReportsService } from "@/lib/domain/deskfy-workflow-reports.service";
import type { DeskfyTaskDetailsResponse } from "@/types/globals";

type Dependencies = {
  deskfyWorkflowReportsService: IDeskfyWorkflowReportsService;
};

/** Caso de uso: detalhes de uma tarefa Deskfy (briefing, anexos com URL pública). */
export async function getDeskfyTaskDetailsUseCase(
  taskId: number,
  deps: Dependencies
): Promise<DeskfyTaskDetailsResponse> {
  if (!Number.isFinite(taskId) || taskId <= 0) {
    throw new Error("Identificador da demanda Deskfy inválido.");
  }

  return deps.deskfyWorkflowReportsService.getTaskDetails(taskId, {
    generateAttachmentPublicUrl: true,
  });
}
