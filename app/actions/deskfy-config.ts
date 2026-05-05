"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getDeskfyConfigRepository } from "@/lib/repositories";
import { getDeskfyIntegrationPanelUseCase } from "@/lib/use-cases/get-deskfy-integration-panel.use-case";
import { saveDeskfyIntegrationSettingsUseCase } from "@/lib/use-cases/save-deskfy-integration-settings.use-case";
import { updateDeskfyApiKeyUseCase } from "@/lib/use-cases/update-deskfy-api-key.use-case";
import type { DeskfyIntegrationPanel } from "@/types/globals";
import {
  deskfyApiKeyFormSchema,
  deskfyIntegrationSettingsFormSchema,
  formDataToDeskfyApiKeyRaw,
  formDataToDeskfyIntegrationSettingsRaw,
} from "@/lib/validation/schemas/deskfy-config-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

export async function getDeskfyIntegrationPanelAction(): Promise<
  { panel: DeskfyIntegrationPanel } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para acessar integrações." };

  try {
    const repo = getDeskfyConfigRepository();
    const panel = await getDeskfyIntegrationPanelUseCase({ deskfyConfigRepository: repo });
    return { panel };
  } catch (err) {
    await logServerActionError("getDeskfyIntegrationPanelAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao carregar configuração Deskfy.",
    };
  }
}

export async function saveDeskfyIntegrationSettingsAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | Record<string, never>> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = deskfyIntegrationSettingsFormSchema.safeParse(
    formDataToDeskfyIntegrationSettingsRaw(formData)
  );
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repo = getDeskfyConfigRepository();
    await saveDeskfyIntegrationSettingsUseCase(
      {
        baseUrl: parsed.data.baseUrl,
        lookbackDays: parsed.data.lookbackDays,
      },
      { deskfyConfigRepository: repo }
    );
    revalidatePath("/integracoes");
    revalidatePath("/demandas/importar");
    return {};
  } catch (err) {
    await logServerActionError("saveDeskfyIntegrationSettingsAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar configuração Deskfy.",
    };
  }
}

export async function updateDeskfyApiKeyAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | Record<string, never>> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = deskfyApiKeyFormSchema.safeParse(formDataToDeskfyApiKeyRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repo = getDeskfyConfigRepository();
    await updateDeskfyApiKeyUseCase(parsed.data.apiKey, { deskfyConfigRepository: repo });
    revalidatePath("/integracoes");
    revalidatePath("/demandas/importar");
    return {};
  } catch (err) {
    await logServerActionError("updateDeskfyApiKeyAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar chave API Deskfy.",
    };
  }
}
