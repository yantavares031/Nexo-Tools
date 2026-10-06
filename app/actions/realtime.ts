"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getCachedSessionRevocationRepository } from "@/lib/infra/cached-session-revocation.repository";
import { getRealtimeHub } from "@/lib/infra/realtime/in-memory-realtime-hub";
import { appLogger } from "@/lib/logger";
import { sessionUserToAuditFields } from "@/lib/logger/audit-context";
import { logServerActionError } from "@/lib/server-action-log";
import { disconnectUserUseCase, sendRealtimeNoticeUseCase } from "@/lib/use-cases/realtime-connections.use-case";
import {
  disconnectUserSchema,
  formDataToRealtimeNoticeRaw,
  realtimeNoticeFormSchema,
} from "@/lib/validation/schemas/realtime-notice-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";

const CONNECTIONS_PATH = "/admin/conexoes";

export async function sendRealtimeNoticeAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string } | null> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para enviar avisos." };

  const parsed = realtimeNoticeFormSchema.safeParse(formDataToRealtimeNoticeRaw(formData));
  if (!parsed.success) return { error: zodErrorToActionMessage(parsed.error) };

  const { target, ...notice } = parsed.data;
  try {
    const { delivered } = sendRealtimeNoticeUseCase({ target, notice }, { hub: getRealtimeHub() });
    appLogger.info(
      { event: "realtime.notice", action: "send_notice", target, delivered, ...sessionUserToAuditFields(session) },
      "Aviso em tempo real enviado"
    );
    return { success: `Aviso enviado para ${delivered} ${delivered === 1 ? "aba aberta" : "abas abertas"}.` };
  } catch (err) {
    await logServerActionError("sendRealtimeNoticeAction", err, { target });
    return { error: err instanceof Error ? err.message : "Não foi possível enviar o aviso." };
  }
}

export async function disconnectUserAction(userId: string): Promise<{ error: string } | { closedTabs: number }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para desconectar usuários." };

  const parsed = disconnectUserSchema.safeParse({ userId });
  if (!parsed.success) return { error: zodErrorToActionMessage(parsed.error) };

  try {
    const result = await disconnectUserUseCase(
      { userId: parsed.data.userId, actorUserId: session.userId },
      { hub: getRealtimeHub(), sessionRevocations: getCachedSessionRevocationRepository() }
    );
    appLogger.info(
      {
        event: "realtime.disconnect",
        action: "disconnect_user",
        targetUserId: parsed.data.userId,
        closedTabs: result.closedTabs,
        ...sessionUserToAuditFields(session),
      },
      "Usuário desconectado pelo admin"
    );
    revalidatePath(CONNECTIONS_PATH);
    return result;
  } catch (err) {
    await logServerActionError("disconnectUserAction", err, { targetUserId: parsed.data.userId });
    return { error: err instanceof Error ? err.message : "Não foi possível desconectar o usuário." };
  }
}
