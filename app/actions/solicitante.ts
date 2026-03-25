"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSolicitanteUseCase } from "@/lib/use-cases/create-solicitante.use-case";
import { updateSolicitanteUseCase } from "@/lib/use-cases/update-solicitante.use-case";
import { removeSolicitanteUseCase } from "@/lib/use-cases/remove-solicitante.use-case";
import { getSolicitanteRepository } from "@/lib/repositories";
import type { SolicitanteInput } from "@/types/globals";

export async function createSolicitanteAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const nome = (formData.get("nome") as string)?.trim() ?? "";
  const unResponsavel = (formData.get("unResponsavel") as string)?.trim() ?? "";

  if (!nome) {
    return {
      error: "Nome é obrigatório.",
    } as const;
  }

  const input: SolicitanteInput = { nome, unResponsavel: unResponsavel || undefined };

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

export async function getSolicitantesPaginatedAction(
  page: number,
  limit: number,
  q?: string
): Promise<import("@/lib/domain/solicitante.repository").SolicitantePaginatedResult> {
  const solicitanteRepository = getSolicitanteRepository();
  return solicitanteRepository.findPaginated(
    q ? { q } : undefined,
    { page, limit }
  );
}

export async function updateSolicitanteAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim() ?? "";
  const unResponsavel = (formData.get("unResponsavel") as string)?.trim() ?? "";

  if (!id || !nome) {
    return { error: "Dados inválidos." } as const;
  }

  const solicitanteRepository = getSolicitanteRepository();
  try {
    await updateSolicitanteUseCase(
      id,
      { nome, unResponsavel: unResponsavel || undefined },
      { solicitanteRepository }
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar solicitante.",
    } as const;
  }

  revalidatePath("/solicitantes");
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/solicitantes?updated=1");
}

export async function removeSolicitanteAction(id: string) {
  const solicitanteRepository = getSolicitanteRepository();
  await removeSolicitanteUseCase(id, { solicitanteRepository });
  revalidatePath("/solicitantes");
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/solicitantes?removed=1");
}
