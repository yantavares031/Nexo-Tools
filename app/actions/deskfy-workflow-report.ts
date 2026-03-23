"use server";

import { getSession } from "@/lib/auth";
import { getDeskfyWorkflowReportsService } from "@/lib/infra/deskfy-workflow-reports.service";
import { getDeskfyWorkflowReportUseCase } from "@/lib/use-cases/get-deskfy-workflow-report.use-case";
import type { DeskfyWorkflowReportItem } from "@/types/globals";

export async function fetchDeskfyWorkflowReportAction(
  _prev: unknown,
  formData: FormData
): Promise<{ items?: DeskfyWorkflowReportItem[]; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role === "agency") return { error: "Sem permissão para importar demandas." };

  try {
    const initialDate = (formData.get("initialDate") as string | null) ?? "";
    const endDate = (formData.get("endDate") as string | null) ?? "";

    const briefingIdRaw = (formData.get("briefingId") as string | null) ?? "";
    const briefingId = briefingIdRaw ? Number.parseInt(briefingIdRaw, 10) : undefined;

    const boardName = ((formData.get("boardName") as string | null) ?? "").trim() || undefined;
    const columnName = ((formData.get("columnName") as string | null) ?? "").trim() || undefined;

    const generateAttachmentPublicUrlRaw = (formData.get("generateAttachmentPublicUrl") as string | null) ?? "";
    const generateAttachmentPublicUrl =
      generateAttachmentPublicUrlRaw === "true" ? true : generateAttachmentPublicUrlRaw === "false" ? false : undefined;

    const items = await getDeskfyWorkflowReportUseCase(
      {
        initialDate,
        endDate,
        briefingId,
        boardName,
        columnName,
        generateAttachmentPublicUrl,
      },
      { deskfyWorkflowReportsService: getDeskfyWorkflowReportsService() }
    );

    return { items };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao consultar relatório Deskfy.",
    };
  }
}

