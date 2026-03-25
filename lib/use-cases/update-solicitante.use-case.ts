import type { Solicitante } from "@/types/globals";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import { capitalizeFirst } from "@/lib/capitalize-first";

type Dependencies = {
  solicitanteRepository: ISolicitanteRepository;
};

export async function updateSolicitanteUseCase(
  id: string,
  input: { nome?: string; unResponsavel?: string },
  deps: Dependencies
): Promise<void> {
  const updates: { nome?: string; unResponsavel?: string } = {};

  if (input.nome !== undefined) {
    updates.nome = capitalizeFirst(input.nome);
    const existentes = await deps.solicitanteRepository.findAll();
    const jaExiste = existentes.some(
      (s) => s.id !== id && s.nome.trim().toLowerCase() === updates.nome!.toLowerCase()
    );
    if (jaExiste) {
      throw new Error("Já existe um solicitante cadastrado com este nome.");
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "unResponsavel")) {
    updates.unResponsavel = input.unResponsavel?.trim() || undefined;
  }

  if (Object.keys(updates).length > 0) {
    await deps.solicitanteRepository.update(id, updates);
  }
}
