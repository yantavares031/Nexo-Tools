"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCentroCustoUseCase } from "@/lib/use-cases/create-centro-custo.use-case";
import { updateCentroCustoUseCase } from "@/lib/use-cases/update-centro-custo.use-case";
import { getCentroCustoRepository } from "@/lib/repositories";
import { getSession } from "@/lib/auth";
import type { CentroCustoInput } from "@/types/globals";

export async function listCentrosCustoAction() {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado" };
  }

  try {
    const repository = getCentroCustoRepository();
    const centrosCusto = repository.findAll();
    return { centrosCusto };
  } catch (error) {
    console.error("Erro ao listar centros de custo:", error);
    return { error: "Erro ao listar centros de custo" };
  }
}

export async function createCentroCustoAction(input: CentroCustoInput) {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado" };
  }

  // Apenas admin e operator podem criar centros de custo
  if (session.role !== "admin" && session.role !== "operator") {
    return { error: "Sem permissão para criar centros de custo" };
  }

  try {
    const repository = getCentroCustoRepository();
    const centroCusto = createCentroCustoUseCase(input, {
      centroCustoRepository: repository,
    });
    revalidatePath("/centros-custo");
    return { centroCusto };
  } catch (error) {
    console.error("Erro ao criar centro de custo:", error);
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

  // Apenas admin e operator podem atualizar centros de custo
  if (session.role !== "admin" && session.role !== "operator") {
    return { error: "Sem permissão para atualizar centros de custo" };
  }

  try {
    const repository = getCentroCustoRepository();
    const centroCusto = updateCentroCustoUseCase(id, input, {
      centroCustoRepository: repository,
    });
    revalidatePath("/centros-custo");
    return { centroCusto };
  } catch (error) {
    console.error("Erro ao atualizar centro de custo:", error);
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

  // Apenas admin e operator podem remover centros de custo
  if (session.role !== "admin" && session.role !== "operator") {
    redirect("/centros-custo?error=" + encodeURIComponent("Sem permissão para remover centros de custo"));
  }

  try {
    const repository = getCentroCustoRepository();
    const success = repository.remove(id);
    if (!success) {
      redirect("/centros-custo?error=" + encodeURIComponent("Centro de custo não encontrado"));
    }

    revalidatePath("/centros-custo");
    redirect("/centros-custo?removed=1");
  } catch (error) {
    console.error("Erro ao remover centro de custo:", error);
    redirect("/centros-custo?error=" + encodeURIComponent("Erro ao remover centro de custo"));
  }
}
