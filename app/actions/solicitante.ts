"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSolicitanteUseCase } from "@/lib/use-cases/create-solicitante.use-case";
import { updateSolicitanteUseCase } from "@/lib/use-cases/update-solicitante.use-case";
import { removeSolicitanteUseCase } from "@/lib/use-cases/remove-solicitante.use-case";
import { getSolicitanteRepository } from "@/lib/repositories";
import type { SolicitanteInput } from "@/types/globals";
import {
  createSolicitanteFormSchema,
  formDataToCreateSolicitanteRaw,
  formDataToUpdateSolicitanteRaw,
  updateSolicitanteFormSchema,
} from "@/lib/validation/schemas/solicitante-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import {
  parseUserRecordId,
  paginationLimitSchema,
  paginationPageSchema,
} from "@/lib/validation/schemas/common";

export async function createSolicitanteAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const parsed = createSolicitanteFormSchema.safeParse(formDataToCreateSolicitanteRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) } as const;
  }

  const input: SolicitanteInput = {
    nome: parsed.data.nome,
    unResponsavel: parsed.data.unResponsavel,
  };

  const solicitanteRepository = getSolicitanteRepository();

  try {
    await createSolicitanteUseCase(input, { solicitanteRepository });
  } catch (err) {
    await logServerActionError("createSolicitanteAction", err, { nome: input.nome });
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
  const p = paginationPageSchema.safeParse(page);
  const l = paginationLimitSchema.safeParse(limit);
  const pageN = p.success ? p.data : 1;
  const limitN = l.success ? l.data : 20;

  const solicitanteRepository = getSolicitanteRepository();
  return solicitanteRepository.findPaginated(
    q ? { q } : undefined,
    { page: pageN, limit: limitN }
  );
}

export async function updateSolicitanteAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const parsed = updateSolicitanteFormSchema.safeParse(formDataToUpdateSolicitanteRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) } as const;
  }

  const { id, nome, unResponsavel } = parsed.data;

  const solicitanteRepository = getSolicitanteRepository();
  try {
    await updateSolicitanteUseCase(
      id,
      { nome, unResponsavel },
      { solicitanteRepository }
    );
  } catch (err) {
    await logServerActionError("updateSolicitanteAction", err, { id });
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
  const idCheck = parseUserRecordId(id);
  if (!idCheck.ok) {
    redirect("/solicitantes?error=" + encodeURIComponent(idCheck.error));
  }

  const solicitanteRepository = getSolicitanteRepository();
  try {
    await removeSolicitanteUseCase(idCheck.id, { solicitanteRepository });
  } catch (err) {
    await logServerActionError("removeSolicitanteAction", err, { id: idCheck.id });
    redirect("/solicitantes?error=" + encodeURIComponent("Erro ao remover solicitante."));
  }
  revalidatePath("/solicitantes");
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/solicitantes?removed=1");
}
