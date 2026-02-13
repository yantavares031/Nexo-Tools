/**
 * Interface do repositório de centros de custo (Clean Architecture).
 */

import type { CentroCusto, CentroCustoInput } from "@/types/globals";

export interface ICentroCustoRepository {
  findAll(): CentroCusto[];
  findById(id: string): CentroCusto | null;
  findByName(nome: string): CentroCusto | null;
  create(input: CentroCustoInput): CentroCusto;
  update(id: string, input: Partial<CentroCustoInput>): CentroCusto | null;
  remove(id: string): boolean;
}
