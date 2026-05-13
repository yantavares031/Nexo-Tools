import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IDeskfyWorkflowReportsService } from "@/lib/domain/deskfy-workflow-reports.service";
import { getNormalizedOcPiKeyFromDeskfyPreview, getOcPiFromDeskfyPreview } from "@/lib/deskfy/deskfy-preview-ocpi";
import { mapDeskfyTaskDetailsToImportPreviewItem } from "@/lib/deskfy/deskfy-workflow-mappers";
import { getDeskfyTaskDetailsUseCase } from "@/lib/use-cases/get-deskfy-task-details.use-case";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import type { DeskfyTaskDetailsResponse } from "@/types/globals";

type Dependencies = {
  deskfyWorkflowReportsService: IDeskfyWorkflowReportsService;
  demandaRepository: IDemandaRepository;
};

export type DeskfyTaskImportByCodeResult = {
  previewItem: DemandaImportadaPreview;
  details: DeskfyTaskDetailsResponse;
};

export async function getDeskfyTaskImportByCodeUseCase(
  taskId: number,
  deps: Dependencies
): Promise<DeskfyTaskImportByCodeResult> {
  const details = await getDeskfyTaskDetailsUseCase(taskId, {
    deskfyWorkflowReportsService: deps.deskfyWorkflowReportsService,
  });

  const previewItem = mapDeskfyTaskDetailsToImportPreviewItem(details);
  const ocPiKey = getNormalizedOcPiKeyFromDeskfyPreview(previewItem);
  const existing = await deps.demandaRepository.findExistingOcPiKeysAmong([ocPiKey]);

  if (existing.has(ocPiKey)) {
    throw new Error(`Já existe uma demanda cadastrada com o código ${getOcPiFromDeskfyPreview(previewItem)}.`);
  }

  return {
    previewItem,
    details,
  };
}

