"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCentroCustoUseCase } from "@/lib/use-cases/create-centro-custo.use-case";
import { updateCentroCustoUseCase } from "@/lib/use-cases/update-centro-custo.use-case";
import { getCentroCustoRepository } from "@/lib/repositories";
import { getSession } from "@/lib/auth";
import type { CentroCustoInput } from "@/types/globals";
import { centroCustoNomeSchema, centroCustoUpdateSchema } from "@/lib/validation/schemas/centro-custo-input";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import { parseEntityId } from "@/lib/validation/schemas/common";

export async function listCentrosCustoAction() {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado" };
  }

  try {
    const repository = getCentroCustoRepository();
    const centrosCusto = await repository.findAll();
    return { centrosCusto };
  } catch (error) {
    await logServerActionError("listCentrosCustoAction", error);
    return { error: "Erro ao listar centros de custo" };
  }
}

export async function createCentroCustoAction(input: CentroCustoInput) {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado" };
  }

  if (session.role !== "admin" && session.role !== "operator") {
    return { error: "Sem permissão para criar centros de custo" };
  }

  const parsed = centroCustoNomeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repository = getCentroCustoRepository();
    const centroCusto = await createCentroCustoUseCase(parsed.data, {
      centroCustoRepository: repository,
    });
    revalidatePath("/centros-custo");
    return { centroCusto };
  } catch (error) {
    await logServerActionError("createCentroCustoAction", error, { nome: parsed.data.nome });
    return {
      error: error instanceof Error ? error.message : "Erro ao criar centro de custo",
    };
  }
}

export async function updateCentroCustoAction(id: string, input: Partial<CentroCustoInput>) {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado" };
  }

  if (session.role !== "admin" && session.role !== "operator") {
    return { error: "Sem permissão para atualizar centros de custo" };
  }

  const idCheck = parseEntityId(id);
  if (!idCheck.ok) {
    return { error: idCheck.error };
  }

  const parsed = centroCustoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repository = getCentroCustoRepository();
    const centroCusto = await updateCentroCustoUseCase(idCheck.id, parsed.data, {
      centroCustoRepository: repository,
    });
    revalidatePath("/centros-custo");
    return { centroCusto };
  } catch (error) {
    await logServerActionError("updateCentroCustoAction", error, { id: idCheck.id });
    return {
      error: error instanceof Error ? error.message : "Erro ao atualizar centro de custo",
    };
  }
}

export async function removeCentroCustoAction(id: string) {
  const session = await getSession();
  if (!session) {
    redirect("/centros-custo?error=" + encodeURIComponent("Não autenticado"));
  }

  if (session.role !== "admin" && session.role !== "operator") {
    redirect("/centros-custo?error=" + encodeURIComponent("Sem permissão para remover centros de custo"));
  }

  const idCheck = parseEntityId(id);
  if (!idCheck.ok) {
    redirect("/centros-custo?error=" + encodeURIComponent(idCheck.error));
  }

  try {
    const repository = getCentroCustoRepository();
    const success = await repository.remove(idCheck.id);
    if (!success) {
      redirect("/centros-custo?error=" + encodeURIComponent("Centro de custo não encontrado"));
    }
    revalidatePath("/centros-custo");
  } catch (error) {
    unstable_rethrow(error);
    await logServerActionError("removeCentroCustoAction", error, { id: idCheck.id });
    redirect("/centros-custo?error=" + encodeURIComponent("Erro ao remover centro de custo"));
  }

  redirect("/centros-custo?removed=1");
}
