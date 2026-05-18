import type { ICertidaoRepository } from "@/lib/domain/certidao.repository";

type Dependencies = {
  certidaoRepository: ICertidaoRepository;
};

export async function removeCertidaoUseCase(
  id: string,
  deps: Dependencies
): Promise<void> {
  const certidao = await deps.certidaoRepository.findById(id);
  if (!certidao) {
    throw new Error("Certidão não encontrada.");
  }
  await deps.certidaoRepository.remove(id);
}
