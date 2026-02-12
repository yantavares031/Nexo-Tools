import type { Solicitante, SolicitanteInput } from "@/types/globals";

/** Contrato do repositório de solicitantes. */
export interface ISolicitanteRepository {
  findAll(): Promise<Solicitante[]>;
  create(input: SolicitanteInput): Promise<Solicitante>;
  remove(id: string): Promise<void>;
}
