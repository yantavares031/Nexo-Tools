"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getSmtpConfigRepository } from "@/lib/repositories";
import { getSmtpConfigPanelUseCase } from "@/lib/use-cases/get-smtp-config-panel.use-case";
import { saveSmtpConfigUseCase } from "@/lib/use-cases/save-smtp-config.use-case";
import { sendSmtpTestEmailUseCase } from "@/lib/use-cases/send-smtp-test-email.use-case";
import type { SmtpConfigPanel } from "@/types/globals";

function parsePort(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) return 587;
  return n;
}

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

  const smtpHost = (formData.get("smtpHost") as string)?.trim() ?? "";
  const smtpPort = parsePort((formData.get("smtpPort") as string) ?? "587");
  const smtpUser = (formData.get("smtpUser") as string)?.trim() ?? "";
  const smtpPassword = (formData.get("smtpPassword") as string) ?? "";
  const enabled = formData.get("enabled") === "true";

  try {
    const repo = getSmtpConfigRepository();
    await saveSmtpConfigUseCase(
      { smtpHost, smtpPort, smtpUser, smtpPassword, enabled },
      { smtpConfigRepository: repo }
    );
    revalidatePath("/integracoes");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar SMTP.",
    };
  }
}

export async function testSmtpEmailAction(formData: FormData): Promise<{ error?: string } | { ok: true }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão." };

  const to = (formData.get("testEmail") as string)?.trim() ?? "";

  try {
    const repo = getSmtpConfigRepository();
    await sendSmtpTestEmailUseCase(to, { smtpConfigRepository: repo });
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao enviar e-mail de teste.",
    };
  }
}
