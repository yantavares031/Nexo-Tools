import type { IDeskfyImportBoardRepository } from "@/lib/domain/deskfy-import-board.repository";

type Dependencies = {
  deskfyImportBoardRepository: IDeskfyImportBoardRepository;
};

/**
 * Caso de uso: remover um board da lista de permitidos para importação Deskfy.
 */
export async function removeDeskfyImportBoardUseCase(
  id: string,
  deps: Dependencies
): Promise<void> {
  await deps.deskfyImportBoardRepository.remove(id);
}
