import type {
  ISolicitanteRepository,
} from "@/lib/domain/solicitante.repository";
import type { Solicitante, SolicitanteInput } from "@/types/globals";

import solicitantesData from "@/data/solicitantes.mock.json";

/** Array mutável para o mock — permite adicionar solicitantes em memória. */
const solicitantes = [...(solicitantesData as Solicitante[])];

export class SolicitanteMockRepository implements ISolicitanteRepository {
  async findAll(): Promise<Solicitante[]> {
    return [...solicitantes].sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );
  }

  async create(input: SolicitanteInput): Promise<Solicitante> {
    const solicitante: Solicitante = {
      ...input,
      id: String(Date.now()),
    };
    solicitantes.push(solicitante);
    return solicitante;
  }

  async remove(id: string): Promise<void> {
    const index = solicitantes.findIndex((s) => s.id === id);
    if (index !== -1) {
      solicitantes.splice(index, 1);
    }
  }
}
