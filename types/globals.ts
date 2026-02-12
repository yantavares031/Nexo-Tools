/**
 * Tipos globais do projeto — ferramenta de cadastro de demandas.
 */

/** Níveis de usuário: admin vê tudo; operator vê dashboard, demandas, solicitantes; agency tem regras específicas. */
export type UserRole = "admin" | "operator" | "agency";

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role: UserRole;
  /** Obrigatório quando role === "agency". ID da agência vinculada ao usuário. */
  agenciaId?: string;
}

/** Dados para criar um usuário (sem id). */
export type UserInput = Omit<User, "id">;

/** Dados para editar um usuário. password vazio = mantém a atual. */
export type UserUpdateInput = Omit<User, "id" | "password"> & {
  password?: string;
};

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

/** Item do dashboard: agência com faturado vs capacidade anual. */
export interface DashboardAgencia {
  agencia: Agencia;
  faturado: number;
  percentual: number; // 0–100, faturado / orcamentoAnual
}

/** Item do dashboard: unidade responsável com faturado e comprometido. */
export interface DashboardUnidade {
  unResponsavel: string;
  faturado: number;
  comprometido: number;
  total: number;
}
