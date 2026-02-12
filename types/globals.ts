/**
 * Tipos globais do projeto — ferramenta de cadastro de demandas.
 */

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
}

export type StatusDemanda = "faturado" | "comprometido";

export interface Demanda {
  id: string;
  demanda: string;
  solicitante: string;
  unResponsavel: string;
  obs: string;
  status: StatusDemanda;
  valor: number;
  centroDeCusto: string;
  ocPi: string;
  mes: string; // ex.: "18/01/2024" ou "janeiro/2024"
  agencia?: string;
  agenciaId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Dados para criar ou editar uma demanda (sem id e timestamps). */
export type DemandaInput = Omit<
  Demanda,
  "id" | "createdAt" | "updatedAt"
>;

export interface Solicitante {
  id: string;
  nome: string;
  unResponsavel: string;
}

/** Dados para criar um solicitante (sem id). */
export type SolicitanteInput = Omit<Solicitante, "id">;

export interface Agencia {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  orcamentoAnual: number;
}

/** Dados para criar uma agência (sem id). */
export type AgenciaInput = Omit<Agencia, "id">;
