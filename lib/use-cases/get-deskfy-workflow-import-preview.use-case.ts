import type { IDeskfyWorkflowReportsService } from "@/lib/domain/deskfy-workflow-reports.service";
import type { IDeskfyImportBoardRepository } from "@/lib/domain/deskfy-import-board.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import { getDeskfyWorkflowReportUseCase } from "@/lib/use-cases/get-deskfy-workflow-report.use-case";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import { mapDeskfyWorkflowReportToImportPreviewItems } from "@/lib/deskfy/deskfy-workflow-mappers";
import { getNormalizedOcPiKeyFromDeskfyPreview } from "@/lib/deskfy/deskfy-preview-ocpi";

type Dependencies = {
  deskfyWorkflowReportsService: IDeskfyWorkflowReportsService;
  deskfyImportBoardRepository: IDeskfyImportBoardRepository;
  demandaRepository: IDemandaRepository;
};

type Input = {
  initialDate: string;
  endDate: string;
  generateAttachmentPublicUrl?: boolean;
};

export async function getDeskfyWorkflowImportPreviewUseCase(
  input: Input,
  deps: Dependencies
): Promise<DemandaImportadaPreview[]> {
  const [items, allowedBoards] = await Promise.all([
    getDeskfyWorkflowReportUseCase(
      {
        initialDate: input.initialDate,
        endDate: input.endDate,
        columnName: "Entregue",
        generateAttachmentPublicUrl: input.generateAttachmentPublicUrl,
      },
      { deskfyWorkflowReportsService: deps.deskfyWorkflowReportsService }
    ),
    deps.deskfyImportBoardRepository.findAll(),
  ]);

  const allowedSet = new Set(allowedBoards.map((b) => b.nome.trim()));

  const isAllowed = (board: string | null | undefined) => {
    const b = board?.trim();
    return !!b && allowedSet.has(b);
  };

  // Regra: apenas boards cadastrados em Integrações → Configurações.
  const filtered = items.filter((i) => isAllowed(i.solicitacao.board));

  const preview = mapDeskfyWorkflowReportToImportPreviewItems(filtered);

  const keys = preview.map((p) => getNormalizedOcPiKeyFromDeskfyPreview(p));
  const existing = await deps.demandaRepository.findExistingOcPiKeysAmong(keys);

  return preview.filter(
    (p) => !existing.has(getNormalizedOcPiKeyFromDeskfyPreview(p))
  );
}

