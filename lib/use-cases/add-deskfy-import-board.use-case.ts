import type { IDeskfyImportBoardRepository } from "@/lib/domain/deskfy-import-board.repository";

type Dependencies = {
  deskfyImportBoardRepository: IDeskfyImportBoardRepository;
};

/**
 * Caso de uso: adicionar um board à lista de permitidos para importação Deskfy.
 * Regra: nome deve ser único.
 */
export async function addDeskfyImportBoardUseCase(
  nome: string,
  deps: Dependencies
) {
  const nomeTrim = nome.trim();
  if (!nomeTrim) {
    throw new Error("Nome do board é obrigatório");
  }

  const existente = await deps.deskfyImportBoardRepository.findByName(nomeTrim);
  if (existente) {
    throw new Error("Este board já está na lista");
  }

  return deps.deskfyImportBoardRepository.create(nomeTrim);
}
