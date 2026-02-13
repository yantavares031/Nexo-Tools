import type { DemandaMensagem, DemandaMensagemInput } from "@/types/globals";
import type { IDemandaMensagemRepository } from "@/lib/domain/demanda-mensagem.repository";

type Dependencies = {
  demandaMensagemRepository: IDemandaMensagemRepository;
};

/**
 * Caso de uso: adicionar uma mensagem a uma demanda.
 * Regras de negócio:
 * - Mensagem não pode estar vazia
 */
export async function addDemandaMensagemUseCase(
  input: DemandaMensagemInput,
  deps: Dependencies
): Promise<DemandaMensagem> {
  const mensagemTrimmed = input.mensagem.trim();
  if (!mensagemTrimmed) {
    throw new Error("A mensagem não pode estar vazia.");
  }

  return deps.demandaMensagemRepository.create({
    ...input,
    mensagem: mensagemTrimmed,
  });
}
