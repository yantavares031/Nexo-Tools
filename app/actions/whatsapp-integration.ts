"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getWhatsAppIntegrationRepository } from "@/lib/repositories";
import { getWhatsAppProvider } from "@/lib/infra/whatsapp/get-whatsapp-provider";
import { isWhatsAppUazapiPlatform, normalizeWhatsAppPlatformId } from "@/lib/whatsapp-platform";
import { connectWhatsAppListInstancesUseCase } from "@/lib/use-cases/connect-whatsapp-list-instances.use-case";
import { getWhatsAppIntegrationPanelUseCase } from "@/lib/use-cases/get-whatsapp-integration-panel.use-case";
import { disconnectWhatsAppIntegrationUseCase } from "@/lib/use-cases/disconnect-whatsapp-integration.use-case";
import { pollWhatsAppInstanceStatusUseCase } from "@/lib/use-cases/poll-whatsapp-instance-status.use-case";
import { selectWhatsAppInstanceUseCase } from "@/lib/use-cases/select-whatsapp-instance.use-case";
import { saveWhatsAppNotifyRecipientsUseCase } from "@/lib/use-cases/save-whatsapp-notify-recipients.use-case";
import { saveWhatsAppAsyncDelaySettingsUseCase } from "@/lib/use-cases/save-whatsapp-async-delay-settings.use-case";
import type {
  WhatsAppInstanceListItem,
  WhatsAppInstanceStatusPayload,
  WhatsAppIntegrationPanel,
} from "@/types/globals";
import {
  formDataToWhatsAppConnectRaw,
  whatsAppConnectFormSchema,
  whatsAppSelectInstanceSchema,
} from "@/lib/validation/schemas/whatsapp-integration-form";
import { whatsAppNotifyRecipientsFormSchema } from "@/lib/validation/schemas/whatsapp-notify-recipients-form";
import { whatsAppAsyncDelayFormSchema } from "@/lib/validation/schemas/whatsapp-async-delay-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

export async function getWhatsAppIntegrationPanelAction(): Promise<
  { panel: WhatsAppIntegrationPanel } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para acessar integrações." };

  try {
    const repo = getWhatsAppIntegrationRepository();
    const panel = await getWhatsAppIntegrationPanelUseCase({
      whatsAppIntegrationRepository: repo,
    });
    return { panel };
  } catch (err) {
    await logServerActionError("getWhatsAppIntegrationPanelAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao carregar integração WhatsApp.",
    };
  }
}

export async function connectWhatsAppIntegrationAction(
  _prev: unknown,
  formData: FormData
): Promise<
  | { instances: WhatsAppInstanceListItem[] }
  | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = whatsAppConnectFormSchema.safeParse(formDataToWhatsAppConnectRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const { platform, baseUrl, adminToken, apiToken, zapiInstanceId, evolutionInstanceName } =
    parsed.data;

  try {
    const repo = getWhatsAppIntegrationRepository();
    const existingRow = await repo.get();
    const pNorm = normalizeWhatsAppPlatformId(platform);

    if (pNorm === "evolution") {
      if (!adminToken.trim() && !existingRow?.adminToken?.trim()) {
        return { error: "Informe a API Key." };
      }
    }
    if (pNorm === "z-api") {
      if (!adminToken.trim() && !existingRow?.adminToken?.trim()) {
        return { error: "Informe o Client-Token." };
      }
      if (!apiToken.trim() && !existingRow?.apiToken?.trim()) {
        return { error: "Informe o token da instância." };
      }
    }

    const instances = await connectWhatsAppListInstancesUseCase(
      {
        platform,
        baseUrl,
        adminToken,
        apiToken,
        providerFields: {
          zapiInstanceId,
          evolutionInstanceName,
        },
      },
      { whatsAppIntegrationRepository: repo }
    );
    revalidatePath("/integracoes");
    return { instances };
  } catch (err) {
    await logServerActionError("connectWhatsAppIntegrationAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao conectar à API WhatsApp.",
    };
  }
}

export async function selectWhatsAppInstanceAction(
  _prev: unknown,
  formData: FormData
): Promise<Record<string, never> | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = whatsAppSelectInstanceSchema.safeParse({
    instanceId: String(formData.get("instanceId") ?? ""),
  });
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repo = getWhatsAppIntegrationRepository();
    const row = await repo.get();
    if (!isWhatsAppUazapiPlatform(row?.platform ?? "")) {
      return { error: "Seleção de instância disponível apenas para UAZAPI." };
    }
    const provider = getWhatsAppProvider("uazapi");
    await selectWhatsAppInstanceUseCase(parsed.data.instanceId, {
      whatsAppIntegrationRepository: repo,
      whatsAppProvider: provider,
    });
    revalidatePath("/integracoes");
    return {};
  } catch (err) {
    await logServerActionError("selectWhatsAppInstanceAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar instância WhatsApp.",
    };
  }
}

export async function disconnectWhatsAppIntegrationAction(): Promise<
  Record<string, never> | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão." };

  try {
    const repo = getWhatsAppIntegrationRepository();
    await disconnectWhatsAppIntegrationUseCase({ whatsAppIntegrationRepository: repo });
    revalidatePath("/integracoes");
    return {};
  } catch (err) {
    await logServerActionError("disconnectWhatsAppIntegrationAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao desconectar.",
    };
  }
}

export async function saveWhatsAppAsyncDelaySettingsAction(
  _prev: unknown,
  formData: FormData
): Promise<Record<string, never> | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = whatsAppAsyncDelayFormSchema.safeParse({
    msgDelayMin: formData.get("msgDelayMin"),
    msgDelayMax: formData.get("msgDelayMax"),
  });
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repo = getWhatsAppIntegrationRepository();
    const row = await repo.get();
    if (!row) {
      return { error: "Configure a integração WhatsApp antes." };
    }
    const provider = getWhatsAppProvider("uazapi");
    await saveWhatsAppAsyncDelaySettingsUseCase(
      {
        msgDelayMin: parsed.data.msgDelayMin,
        msgDelayMax: parsed.data.msgDelayMax,
      },
      { whatsAppIntegrationRepository: repo, whatsAppProvider: provider }
    );
    revalidatePath("/integracoes");
    return {};
  } catch (err) {
    await logServerActionError("saveWhatsAppAsyncDelaySettingsAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar delay da fila async.",
    };
  }
}

export async function saveWhatsAppNotifyRecipientsAction(
  _prev: unknown,
  formData: FormData
): Promise<Record<string, never> | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = whatsAppNotifyRecipientsFormSchema.safeParse({
    recipientsJson: String(formData.get("recipientsJson") ?? "[]"),
  });
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repo = getWhatsAppIntegrationRepository();
    const row = await repo.get();
    if (!row?.selectedInstanceId?.trim() || !row.instanceToken?.trim()) {
      return { error: "Configure e salve uma instância WhatsApp antes dos receptores." };
    }
    await saveWhatsAppNotifyRecipientsUseCase(parsed.data.recipients, {
      whatsAppIntegrationRepository: repo,
    });
    revalidatePath("/integracoes");
    return {};
  } catch (err) {
    await logServerActionError("saveWhatsAppNotifyRecipientsAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar receptores.",
    };
  }
}

export async function pollWhatsAppInstanceStatusAction(): Promise<
  { payload: WhatsAppInstanceStatusPayload } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão." };

  try {
    const repo = getWhatsAppIntegrationRepository();
    const row = await repo.get();
    if (!row || !isWhatsAppUazapiPlatform(row.platform)) {
      return {
        payload: {
          instanceId: null,
          name: null,
          status: null,
          profileName: null,
          paircode: null,
          qrcode: null,
          lastDisconnectReason: null,
          apiConnected: false,
          apiLoggedIn: false,
        },
      };
    }
    const provider = getWhatsAppProvider("uazapi");
    const payload = await pollWhatsAppInstanceStatusUseCase({
      whatsAppIntegrationRepository: repo,
      whatsAppProvider: provider,
    });
    return { payload };
  } catch (err) {
    await logServerActionError("pollWhatsAppInstanceStatusAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao consultar status.",
    };
  }
}
