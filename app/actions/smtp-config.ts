"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getSmtpConfigRepository } from "@/lib/repositories";
import { getSmtpConfigPanelUseCase } from "@/lib/use-cases/get-smtp-config-panel.use-case";
import { saveSmtpConfigUseCase } from "@/lib/use-cases/save-smtp-config.use-case";
import { sendSmtpTestEmailUseCase } from "@/lib/use-cases/send-smtp-test-email.use-case";
import type { SmtpConfigPanel } from "@/types/globals";
import {
  formDataToSmtpRaw,
  formDataToSmtpTestRaw,
  parseOrdemCompraNotifyEmailsFromText,
  smtpSaveFormSchema,
  smtpTestEmailSchema,
} from "@/lib/validation/schemas/smtp-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

export async function getSmtpConfigPanelAction(): Promise<
  { panel: SmtpConfigPanel } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para acessar integrações." };

  try {
    const repo = getSmtpConfigRepository();
    const panel = await getSmtpConfigPanelUseCase({ smtpConfigRepository: repo });
    return { panel };
  } catch (err) {
    await logServerActionError("getSmtpConfigPanelAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao carregar SMTP.",
    };
  }
}

export async function saveSmtpConfigAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | Record<string, never>> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão para editar integrações." };

  const parsed = smtpSaveFormSchema.safeParse(formDataToSmtpRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const { smtpHost, smtpPort, smtpUser, smtpPassword, enabled, ordemCompraNotifyEmails } =
    parsed.data;

  const emailsParsed = parseOrdemCompraNotifyEmailsFromText(ordemCompraNotifyEmails);
  if (!emailsParsed.ok) {
    return { error: emailsParsed.message };
  }

  try {
    const repo = getSmtpConfigRepository();
    await saveSmtpConfigUseCase(
      {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        enabled,
        ordemCompraNotifyEmails: emailsParsed.emails,
      },
      { smtpConfigRepository: repo }
    );
    revalidatePath("/integracoes");
    return {};
  } catch (err) {
    await logServerActionError("saveSmtpConfigAction", err, { smtpUser });
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar SMTP.",
    };
  }
}

export async function testSmtpEmailAction(formData: FormData): Promise<{ error?: string } | { ok: true }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão." };

  const parsed = smtpTestEmailSchema.safeParse(formDataToSmtpTestRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repo = getSmtpConfigRepository();
    await sendSmtpTestEmailUseCase(parsed.data.testEmail, { smtpConfigRepository: repo });
    return { ok: true };
  } catch (err) {
    await logServerActionError("testSmtpEmailAction", err, { to: parsed.data.testEmail });
    return {
      error: err instanceof Error ? err.message : "Falha ao enviar e-mail de teste.",
    };
  }
}
