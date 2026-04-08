"use server";

import { getSession } from "@/lib/auth";
import { getDeskfyWorkflowReportsService } from "@/lib/infra/deskfy-workflow-reports.service";
import { getDeskfyTaskDetailsUseCase } from "@/lib/use-cases/get-deskfy-task-details.use-case";
import type { DeskfyTaskDetailsResponse } from "@/types/globals";

export async function getDeskfyTaskDetailsAction(
  taskIdRaw: string
): Promise<{ data?: DeskfyTaskDetailsResponse; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role === "agency") return { error: "Sem permissão para importar demandas." };

  const taskId = Number.parseInt(String(taskIdRaw).trim(), 10);

  try {
    const data = await getDeskfyTaskDetailsUseCase(taskId, {
      deskfyWorkflowReportsService: getDeskfyWorkflowReportsService(),
    });
    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao carregar detalhes da demanda na Deskfy.",
    };
  }
}
