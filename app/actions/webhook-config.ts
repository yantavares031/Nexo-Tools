"use server";

import { revalidatePath } from "next/cache";
import { getWebhookConfigUseCase } from "@/lib/use-cases/get-webhook-config.use-case";
import { saveWebhookConfigUseCase } from "@/lib/use-cases/save-webhook-config.use-case";
import { getWebhookConfigRepository } from "@/lib/repositories";
import { getSession } from "@/lib/auth";
import type { WebhookConfig, WebhookEventCode, WebhookContact } from "@/types/globals";

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

  const url = (formData.get("url") as string)?.trim() ?? "";
  const enabled = formData.get("enabled") === "true";
  const whatsappMod = formData.get("whatsappMod") === "true";
  const eventsRaw = formData.get("events") as string | null;
  let events: WebhookEventCode[] = [];
  if (eventsRaw) {
    try {
      const parsed = JSON.parse(eventsRaw) as unknown[];
      events = parsed.filter(
        (e): e is WebhookEventCode =>
          e === "demanda.criada" || e === "demanda.comprovada"
      );
    } catch {
      events = [];
    }
  }
  const contactListRaw = formData.get("contactList") as string | null;
  let contactList: WebhookContact[] = [];
  if (contactListRaw) {
    try {
      const parsed = JSON.parse(contactListRaw) as unknown[];
      contactList = parsed
        .filter(
          (c): c is WebhookContact =>
            typeof c === "object" && c !== null && "phone" in c && typeof (c as WebhookContact).phone === "string"
        )
        .map((c) => ({
          phone: (c as WebhookContact).phone.trim(),
          name: (c as WebhookContact).name?.trim() || undefined,
        }))
        .filter((c) => c.phone.length > 0);
    } catch {
      contactList = [];
    }
  }

  const result = await saveWebhookConfigUseCase(
    { url, enabled, events, whatsappMod, contactList },
    { webhookConfigRepository: getWebhookConfigRepository() }
  );

  if ("error" in result) return { error: result.error };
  revalidatePath("/integracoes");
  return {};
}

export async function testWebhookAction(
  url: string
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para testar webhook." };

  const trimmed = (url ?? "").trim();
  if (!trimmed) return { error: "Informe a URL do webhook para testar." };

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
    const message = err instanceof Error ? err.message : "Erro ao enviar teste";
    return { error: message };
  }
}
