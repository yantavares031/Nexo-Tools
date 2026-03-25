import type { Solicitante, SolicitanteInput } from "@/types/globals";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import { capitalizeFirst } from "@/lib/capitalize-first";

type Dependencies = {
  solicitanteRepository: ISolicitanteRepository;
};

/** Regra de negócio: um solicitante não pode ter mais de uma unidade. Se já existe cadastro com o nome, não permite novo cadastro. */
export async function createSolicitanteUseCase(
  input: SolicitanteInput,
  deps: Dependencies
): Promise<Solicitante> {
  const nomeNormalizado = capitalizeFirst(input.nome);
  const existentes = await deps.solicitanteRepository.findAll();
  const jaExiste = existentes.some(
    (s) => s.nome.trim().toLowerCase() === nomeNormalizado.toLowerCase()
  );

  if (jaExiste) {
    throw new Error("Já existe um solicitante cadastrado com este nome.");
  }

  return deps.solicitanteRepository.create({
    ...input,
    nome: nomeNormalizado,
  });
}
