"use server";

import { revalidatePath } from "next/cache";
import { getWebhookConfigUseCase } from "@/lib/use-cases/get-webhook-config.use-case";
import { saveWebhookConfigUseCase } from "@/lib/use-cases/save-webhook-config.use-case";
import { getWebhookConfigRepository } from "@/lib/repositories";
import { getSession } from "@/lib/auth";
import type { WebhookConfig, WebhookEventCode, WebhookContact } from "@/types/globals";
import {
  formDataToWebhookConfigRaw,
  parseWebhookContactListJson,
  parseWebhookEventsJson,
  testWebhookUrlSchema,
  webhookConfigFormSchema,
} from "@/lib/validation/schemas/webhook-actions";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

export async function getWebhookConfigAction(): Promise<
  { config: WebhookConfig } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para acessar integrações." };

  try {
    const repo = getWebhookConfigRepository();
    const config = await getWebhookConfigUseCase({ webhookConfigRepository: repo });
    return { config };
  } catch (err) {
    await logServerActionError("getWebhookConfigAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao carregar configuração de webhook.",
    };
  }
}

export async function updateWebhookConfigAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = webhookConfigFormSchema.safeParse(formDataToWebhookConfigRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const { url, enabled, whatsappMod, eventsJson, contactListJson } = parsed.data;
  const events: WebhookEventCode[] = parseWebhookEventsJson(eventsJson);
  const contactList: WebhookContact[] = parseWebhookContactListJson(contactListJson);

  try {
    const result = await saveWebhookConfigUseCase(
      { url, enabled, events, whatsappMod, contactList },
      { webhookConfigRepository: getWebhookConfigRepository() }
    );

    if ("error" in result) return { error: result.error };
    revalidatePath("/integracoes");
    return {};
  } catch (err) {
    await logServerActionError("updateWebhookConfigAction", err, { enabled });
    return { error: err instanceof Error ? err.message : "Erro ao salvar webhook." };
  }
}

export async function testWebhookAction(
  url: string
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para testar webhook." };

  const parsed = testWebhookUrlSchema.safeParse({ url });
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const trimmed = parsed.data.url;

  try {
    const res = await fetch(trimmed, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test",
        message: "Teste de conexão do NEXO Tools",
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { error: `Resposta ${res.status}: ${res.statusText}` };
    }
    return { success: true };
  } catch (err) {
    await logServerActionError("testWebhookAction", err, { url: trimmed });
    const message = err instanceof Error ? err.message : "Erro ao enviar teste";
    return { error: message };
  }
}
