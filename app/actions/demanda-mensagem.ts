"use server";

import { revalidatePath } from "next/cache";
import { addDemandaMensagemUseCase } from "@/lib/use-cases/add-demanda-mensagem.use-case";
import { getDemandaMensagemRepository } from "@/lib/repositories";
import { getSession } from "@/lib/auth";
import type { DemandaMensagem } from "@/types/globals";

export async function addDemandaMensagemAction(
  demandaId: string,
  mensagem: string
): Promise<{ error?: string; mensagem?: DemandaMensagem }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }

  const mensagemRepository = getDemandaMensagemRepository();
  try {
    const novaMensagem = await addDemandaMensagemUseCase(
      {
        demandaId,
        mensagem,
        autor: session.name,
      },
      {
        demandaMensagemRepository: mensagemRepository,
      }
    );
    revalidatePath("/");
    return { mensagem: novaMensagem };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao adicionar mensagem.",
    } as const;
  }
}

export async function getDemandaMensagensAction(
  demandaId: string
): Promise<DemandaMensagem[]> {
  const mensagemRepository = getDemandaMensagemRepository();
  return mensagemRepository.findByDemandaId(demandaId);
}
