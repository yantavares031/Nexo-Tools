"use server";

import { getSession } from "@/lib/auth";
import { getDeskfyWorkflowReportsService } from "@/lib/infra/deskfy-workflow-reports.service";
import { getDeskfyTaskDetailsUseCase } from "@/lib/use-cases/get-deskfy-task-details.use-case";
import { getDeskfyTaskImportByCodeUseCase } from "@/lib/use-cases/get-deskfy-task-import-by-code.use-case";
import { getDemandaRepository } from "@/lib/repositories";
import { normalizeDeskfyUserMessage } from "@/lib/deskfy/deskfy-user-message";
import { logServerActionError } from "@/lib/server-action-log";
import { deskfyTaskCodeSchema, deskfyTaskIdSchema } from "@/lib/validation/schemas/deskfy-forms";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import type { DeskfyTaskDetailsResponse } from "@/types/globals";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";

export async function getDeskfyTaskDetailsAction(
  taskIdRaw: string
): Promise<{ data?: DeskfyTaskDetailsResponse; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role === "agency") return { error: "Sem permissão para importar demandas." };

  const taskIdParsed = deskfyTaskIdSchema.safeParse(taskIdRaw);
  if (!taskIdParsed.success) {
    return { error: zodErrorToActionMessage(taskIdParsed.error) };
  }
  const taskId = taskIdParsed.data;

  try {
    const deskfyWorkflowReportsService = await getDeskfyWorkflowReportsService();
    const data = await getDeskfyTaskDetailsUseCase(taskId, {
      deskfyWorkflowReportsService,
    });
    return { data };
  } catch (err) {
    await logServerActionError("getDeskfyTaskDetailsAction", err, { taskId });
    return {
      error: normalizeDeskfyUserMessage(err, {
        fallback: "Erro ao carregar os detalhes da solicitação na Deskfy.",
      }),
    };
  }
}

export async function getDeskfyTaskImportByCodeAction(
  codeRaw: string
): Promise<{ data?: { previewItem: DemandaImportadaPreview; details: DeskfyTaskDetailsResponse }; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role === "agency") return { error: "Sem permissão para importar demandas." };

  const taskIdParsed = deskfyTaskCodeSchema.safeParse(codeRaw);
  if (!taskIdParsed.success) {
    return { error: zodErrorToActionMessage(taskIdParsed.error) };
  }

  const taskId = taskIdParsed.data;

  try {
    const deskfyWorkflowReportsService = await getDeskfyWorkflowReportsService();
    const data = await getDeskfyTaskImportByCodeUseCase(taskId, {
      deskfyWorkflowReportsService,
      demandaRepository: getDemandaRepository(),
    });
    return { data };
  } catch (err) {
    await logServerActionError("getDeskfyTaskImportByCodeAction", err, { codeRaw, taskId });
    return {
      error: normalizeDeskfyUserMessage(err, {
        fallback: "Erro ao buscar a solicitação da Deskfy pelo código informado.",
      }),
    };
  }
}
