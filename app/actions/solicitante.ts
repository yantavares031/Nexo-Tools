"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSolicitanteUseCase } from "@/lib/use-cases/create-solicitante.use-case";
import { removeSolicitanteUseCase } from "@/lib/use-cases/remove-solicitante.use-case";
import { getSolicitanteRepository } from "@/lib/repositories";
import type { SolicitanteInput } from "@/types/globals";

export async function createSolicitanteAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const nome = (formData.get("nome") as string)?.trim() ?? "";
  const unResponsavel = (formData.get("unResponsavel") as string)?.trim() ?? "";

  if (!nome || !unResponsavel) {
    return {
      error: "Nome e unidade responsável são obrigatórios.",
    } as const;
  }

  const input: SolicitanteInput = { nome, unResponsavel };

  const solicitanteRepository = getSolicitanteRepository();

  try {
    await createSolicitanteUseCase(input, { solicitanteRepository });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao cadastrar solicitante.",
    } as const;
  }

  redirect("/solicitantes");
}

export async function removeSolicitanteAction(id: string) {
  const solicitanteRepository = getSolicitanteRepository();
  await removeSolicitanteUseCase(id, { solicitanteRepository });
  revalidatePath("/solicitantes");
  revalidatePath("/");
  redirect("/solicitantes?removed=1");
}
