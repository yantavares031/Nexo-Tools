"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAgenciaUseCase } from "@/lib/use-cases/create-agencia.use-case";
import { updateAgenciaUseCase } from "@/lib/use-cases/update-agencia.use-case";
import { removeAgenciaUseCase } from "@/lib/use-cases/remove-agencia.use-case";
import { getAgenciaRepository } from "@/lib/repositories";
import { parseBrazilianCurrency } from "@/lib/currency";
import type { AgenciaInput } from "@/types/globals";
import { agenciaFormSchema, formDataToAgenciaRaw } from "@/lib/validation/schemas/agencia-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import { parseUserRecordId } from "@/lib/validation/schemas/common";

export async function createAgenciaAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const parsed = agenciaFormSchema.safeParse(formDataToAgenciaRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) } as const;
  }

  const { nomeFantasia, cnpj, boardId } = parsed.data;
  const orcamentoAnual = parseBrazilianCurrency(parsed.data.orcamentoAnual);

  const input: AgenciaInput = { nomeFantasia, cnpj, orcamentoAnual, boardId };

  const agenciaRepository = getAgenciaRepository();
  try {
    await createAgenciaUseCase(input, { agenciaRepository });
  } catch (err) {
    await logServerActionError("createAgenciaAction", err, { nomeFantasia });
    return {
      error: err instanceof Error ? err.message : "Erro ao criar agência.",
    } as const;
  }

  revalidatePath("/agencias");
  revalidatePath("/dashboard");
  redirect("/agencias?created=1");
}

export async function updateAgenciaAction(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const idCheck = parseUserRecordId(id);
  if (!idCheck.ok) {
    return { error: idCheck.error } as const;
  }

  const parsed = agenciaFormSchema.safeParse(formDataToAgenciaRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) } as const;
  }

  const { nomeFantasia, cnpj, boardId } = parsed.data;
  const orcamentoAnual = parseBrazilianCurrency(parsed.data.orcamentoAnual);

  const input: AgenciaInput = { nomeFantasia, cnpj, orcamentoAnual, boardId };

  const agenciaRepository = getAgenciaRepository();
  try {
    await updateAgenciaUseCase(idCheck.id, input, { agenciaRepository });
  } catch (err) {
    await logServerActionError("updateAgenciaAction", err, { id: idCheck.id });
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar agência.",
    } as const;
  }

  revalidatePath(`/agencias/${idCheck.id}`);
  revalidatePath("/agencias");
  revalidatePath("/dashboard");
  redirect("/agencias?updated=1");
}

export async function removeAgenciaAction(id: string) {
  const idCheck = parseUserRecordId(id);
  if (!idCheck.ok) {
    redirect("/agencias?error=" + encodeURIComponent(idCheck.error));
  }

  const agenciaRepository = getAgenciaRepository();
  try {
    await removeAgenciaUseCase(idCheck.id, { agenciaRepository });
  } catch (err) {
    await logServerActionError("removeAgenciaAction", err, { id: idCheck.id });
    redirect("/agencias?error=" + encodeURIComponent("Erro ao remover agência."));
  }

  revalidatePath("/agencias");
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/agencias?removed=1");
}
