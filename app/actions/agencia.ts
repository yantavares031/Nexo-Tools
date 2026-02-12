"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAgenciaUseCase } from "@/lib/use-cases/create-agencia.use-case";
import { updateAgenciaUseCase } from "@/lib/use-cases/update-agencia.use-case";
import { removeAgenciaUseCase } from "@/lib/use-cases/remove-agencia.use-case";
import { getAgenciaRepository } from "@/lib/repositories";
import { parseBrazilianCurrency } from "@/lib/currency";
import type { AgenciaInput } from "@/types/globals";

export async function createAgenciaAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const nomeFantasia = (formData.get("nomeFantasia") as string)?.trim() ?? "";
  const cnpj = (formData.get("cnpj") as string)?.trim() ?? "";
  const orcamentoAnual = parseBrazilianCurrency(
    (formData.get("orcamentoAnual") as string) ?? ""
  );

  if (!nomeFantasia || !cnpj) {
    return {
      error: "Nome fantasia e CNPJ são obrigatórios.",
    } as const;
  }

  const input: AgenciaInput = { nomeFantasia, cnpj, orcamentoAnual };

  const agenciaRepository = getAgenciaRepository();
  await createAgenciaUseCase(input, { agenciaRepository });

  revalidatePath("/agencias");
  redirect("/agencias?created=1");
}

export async function updateAgenciaAction(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const nomeFantasia = (formData.get("nomeFantasia") as string)?.trim() ?? "";
  const cnpj = (formData.get("cnpj") as string)?.trim() ?? "";
  const orcamentoAnual = parseBrazilianCurrency(
    (formData.get("orcamentoAnual") as string) ?? ""
  );

  if (!nomeFantasia || !cnpj) {
    return {
      error: "Nome fantasia e CNPJ são obrigatórios.",
    } as const;
  }

  const input: AgenciaInput = { nomeFantasia, cnpj, orcamentoAnual };

  const agenciaRepository = getAgenciaRepository();
  await updateAgenciaUseCase(id, input, { agenciaRepository });

  revalidatePath(`/agencias/${id}`);
  revalidatePath("/agencias");
  redirect("/agencias?updated=1");
}

export async function removeAgenciaAction(id: string) {
  const agenciaRepository = getAgenciaRepository();
  await removeAgenciaUseCase(id, { agenciaRepository });

  revalidatePath("/agencias");
  revalidatePath("/");
  redirect("/agencias?removed=1");
}
