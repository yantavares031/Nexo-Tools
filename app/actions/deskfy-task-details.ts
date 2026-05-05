"use server";

import { getSession } from "@/lib/auth";
import { getDeskfyWorkflowReportsService } from "@/lib/infra/deskfy-workflow-reports.service";
import { getDeskfyTaskDetailsUseCase } from "@/lib/use-cases/get-deskfy-task-details.use-case";
import { logServerActionError } from "@/lib/server-action-log";
import { deskfyTaskIdSchema } from "@/lib/validation/schemas/deskfy-forms";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import type { DeskfyTaskDetailsResponse } from "@/types/globals";

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
      error: err instanceof Error ? err.message : "Erro ao carregar detalhes da demanda na Deskfy.",
    };
  }
}
