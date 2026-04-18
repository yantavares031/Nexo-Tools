"use server";

import { getSession } from "@/lib/auth";
import { getDeskfyWorkflowReportsService } from "@/lib/infra/deskfy-workflow-reports.service";
import { getDeskfyWorkflowReportUseCase } from "@/lib/use-cases/get-deskfy-workflow-report.use-case";
import { logServerActionError } from "@/lib/server-action-log";
import {
  deskfyWorkflowReportFormSchema,
  formDataToDeskfyWorkflowRaw,
} from "@/lib/validation/schemas/deskfy-forms";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import type { DeskfyWorkflowReportItem } from "@/types/globals";

export async function fetchDeskfyWorkflowReportAction(
  _prev: unknown,
  formData: FormData
): Promise<{ items?: DeskfyWorkflowReportItem[]; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role === "agency") return { error: "Sem permissão para importar demandas." };

  const parsed = deskfyWorkflowReportFormSchema.safeParse(formDataToDeskfyWorkflowRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const { initialDate, endDate, briefingId, boardName, columnName, generateAttachmentPublicUrl } =
    parsed.data;

  try {
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
    logServerActionError("fetchDeskfyWorkflowReportAction", err, {
      hasBriefingId: briefingId != null,
    });
    return {
      error: err instanceof Error ? err.message : "Erro ao consultar relatório Deskfy.",
    };
  }
}

