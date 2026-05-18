import type { Certidao, CertidaoInput } from "@/types/globals";
import type { ICertidaoRepository } from "@/lib/domain/certidao.repository";

type Dependencies = {
  certidaoRepository: ICertidaoRepository;
};

export async function createCertidaoUseCase(
  input: CertidaoInput,
  deps: Dependencies
): Promise<Certidao> {
  if (!input.nomeArquivo?.trim()) {
    throw new Error("Nome do arquivo é obrigatório.");
  }
  if (!input.caminhoArquivo?.trim()) {
    throw new Error("Caminho do arquivo é obrigatório.");
  }
  return deps.certidaoRepository.create(input);
}
