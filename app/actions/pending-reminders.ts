"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getPendingReminderConfigRepository } from "@/lib/repositories";
import { makePendingRemindersDeps } from "@/lib/infra/pending-reminders-deps";
import {
  getPendingReminderConfigUseCase,
  savePendingReminderConfigUseCase,
} from "@/lib/use-cases/save-pending-reminder-config.use-case";
import {
  sendPendingRemindersUseCase,
  type PendingRemindersResult,
} from "@/lib/use-cases/send-pending-reminders.use-case";
import type { PendingReminderConfig } from "@/types/globals";
import {
  formDataToPendingReminderRaw,
  pendingReminderFormSchema,
} from "@/lib/validation/schemas/pending-reminder-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

export async function getPendingReminderConfigAction(): Promise<
  { config: PendingReminderConfig } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para acessar integrações." };

  try {
    const config = await getPendingReminderConfigUseCase({
      pendingReminderConfigRepository: getPendingReminderConfigRepository(),
    });
    return { config };
  } catch (err) {
    await logServerActionError("getPendingReminderConfigAction", err);
    return { error: "Não foi possível carregar a configuração de lembretes." };
  }
}

export async function savePendingReminderConfigAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: true } | null> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = pendingReminderFormSchema.safeParse(formDataToPendingReminderRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    await savePendingReminderConfigUseCase(parsed.data, {
      pendingReminderConfigRepository: getPendingReminderConfigRepository(),
    });
    revalidatePath("/integracoes");
    return { success: true };
  } catch (err) {
    await logServerActionError("savePendingReminderConfigAction", err);
    return { error: "Não foi possível salvar a configuração de lembretes." };
  }
}

export async function runPendingRemindersNowAction(): Promise<
  { result: PendingRemindersResult } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para enviar lembretes." };

  try {
    const result = await sendPendingRemindersUseCase({ force: true }, makePendingRemindersDeps());
    revalidatePath("/integracoes");
    return { result };
  } catch (err) {
    await logServerActionError("runPendingRemindersNowAction", err);
    return { error: "Não foi possível enviar os lembretes agora." };
  }
}
