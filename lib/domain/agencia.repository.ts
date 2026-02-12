import type { Agencia, AgenciaInput } from "@/types/globals";

/** Contrato do repositório de agências — permite trocar por Postgres, MySQL, etc. */
export interface IAgenciaRepository {
  findAll(): Promise<Agencia[]>;
  findById(id: string): Promise<Agencia | null>;
  create(input: AgenciaInput): Promise<Agencia>;
  update(id: string, input: AgenciaInput): Promise<Agencia>;
  remove(id: string): Promise<void>;
}
