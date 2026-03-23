/**
 * Interface do repositório de centros de custo (Clean Architecture).
 */

import type { CentroCusto, CentroCustoInput } from "@/types/globals";

export interface ICentroCustoRepository {
  findAll(): Promise<CentroCusto[]>;
  findById(id: string): Promise<CentroCusto | null>;
  findByName(nome: string): Promise<CentroCusto | null>;
  create(input: CentroCustoInput): Promise<CentroCusto>;
  update(id: string, input: Partial<CentroCustoInput>): Promise<CentroCusto | null>;
  remove(id: string): Promise<boolean>;
}
