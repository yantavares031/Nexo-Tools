"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getCapacityAlertRepository } from "@/lib/repositories";
import { makeCapacityAlertsDeps } from "@/lib/infra/capacity-alerts-deps";
import {
  getCapacityAlertPanelUseCase,
  saveCapacityAlertConfigUseCase,
  type CapacityAlertPanel,
} from "@/lib/use-cases/capacity-alert-config.use-case";
import {
  checkCapacityAlertsUseCase,
  type CapacityAlertsResult,
} from "@/lib/use-cases/check-capacity-alerts.use-case";
import {
  capacityAlertFormSchema,
  formDataToCapacityAlertRaw,
} from "@/lib/validation/schemas/capacity-alert-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

export async function getCapacityAlertPanelAction(): Promise<{ panel: CapacityAlertPanel } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para acessar integrações." };

  try {
    const panel = await getCapacityAlertPanelUseCase({ capacityAlertRepository: getCapacityAlertRepository() });
    return { panel };
  } catch (err) {
    await logServerActionError("getCapacityAlertPanelAction", err);
    return { error: "Não foi possível carregar os alertas de capacidade." };
  }
}

export async function saveCapacityAlertConfigAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: true } | null> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = capacityAlertFormSchema.safeParse(formDataToCapacityAlertRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    await saveCapacityAlertConfigUseCase(parsed.data, { capacityAlertRepository: getCapacityAlertRepository() });
  } catch (err) {
    await logServerActionError("saveCapacityAlertConfigAction", err);
    return { error: err instanceof Error ? err.message : "Não foi possível salvar os alertas de capacidade." };
  }

  await checkCapacityAlertsUseCase(makeCapacityAlertsDeps());
  revalidatePath("/integracoes");
  return { success: true };
}

export async function runCapacityAlertsNowAction(): Promise<{ result: CapacityAlertsResult } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para verificar alertas." };

  const result = await checkCapacityAlertsUseCase(makeCapacityAlertsDeps());
  revalidatePath("/integracoes");
  return { result };
}
