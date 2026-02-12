"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDemandaUseCase } from "@/lib/use-cases/create-demanda.use-case";
import { updateDemandaUseCase } from "@/lib/use-cases/update-demanda.use-case";
import { removeDemandaUseCase } from "@/lib/use-cases/remove-demanda.use-case";
import { getDemandaRepository } from "@/lib/repositories";
import { parseBrazilianCurrency } from "@/lib/currency";
import type { DemandaInput } from "@/types/globals";

export async function createDemandaAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const demanda = (formData.get("demanda") as string)?.trim() ?? "";
  const solicitante = (formData.get("solicitante") as string)?.trim() ?? "";
  const unResponsavel = (formData.get("unResponsavel") as string)?.trim() ?? "";
  const obs = (formData.get("obs") as string)?.trim() ?? "";
  const status = (formData.get("status") as string) ?? "comprometido";
  const valor = parseBrazilianCurrency((formData.get("valor") as string) ?? "");
  const centroDeCusto = (formData.get("centroDeCusto") as string)?.trim() ?? "";
  const ocPi = (formData.get("ocPi") as string)?.trim() ?? "";
  const mes = (formData.get("mes") as string)?.trim() ?? "";
  const agencia = (formData.get("agencia") as string)?.trim() || undefined;

  if (!demanda || !solicitante || !unResponsavel) {
    return { error: "Demanda, solicitante e unidade responsável são obrigatórios." } as const;
  }

  const input: DemandaInput = {
    demanda,
    solicitante,
    unResponsavel,
    obs,
    status: status as "faturado" | "comprometido",
    valor,
    centroDeCusto,
    ocPi,
    mes,
    agencia,
  };

  const demandaRepository = getDemandaRepository();
  await createDemandaUseCase(input, { demandaRepository });

  redirect("/");
}

export async function updateDemandaAction(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const demanda = (formData.get("demanda") as string)?.trim() ?? "";
  const solicitante = (formData.get("solicitante") as string)?.trim() ?? "";
  const unResponsavel = (formData.get("unResponsavel") as string)?.trim() ?? "";
  const obs = (formData.get("obs") as string)?.trim() ?? "";
  const status = (formData.get("status") as string) ?? "comprometido";
  const valor = parseBrazilianCurrency((formData.get("valor") as string) ?? "");
  const centroDeCusto = (formData.get("centroDeCusto") as string)?.trim() ?? "";
  const ocPi = (formData.get("ocPi") as string)?.trim() ?? "";
  const mes = (formData.get("mes") as string)?.trim() ?? "";
  const agencia = (formData.get("agencia") as string)?.trim() || undefined;

  if (!demanda || !solicitante || !unResponsavel) {
    return { error: "Demanda, solicitante e unidade responsável são obrigatórios." } as const;
  }

  const input: DemandaInput = {
    demanda,
    solicitante,
    unResponsavel,
    obs,
    status: status as "faturado" | "comprometido",
    valor,
    centroDeCusto,
    ocPi,
    mes,
    agencia,
  };

  const demandaRepository = getDemandaRepository();
  try {
    await updateDemandaUseCase(id, input, { demandaRepository });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar demanda.",
    } as const;
  }
  revalidatePath("/");
  redirect("/?updated=1");
}

export async function removeDemandaAction(id: string) {
  const demandaRepository = getDemandaRepository();
  await removeDemandaUseCase(id, { demandaRepository });
  revalidatePath("/");
  redirect("/?removed=1");
}
