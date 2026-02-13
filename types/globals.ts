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
  /** true = liberado, false = bloqueado. Padrão true. */
  acesso: boolean;
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
  /** Mês/ano de referência no formato YYYY-MM (ex.: "2024-01"). Exibição em pt-BR como MM/YYYY. */
  mes: string;
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

export interface DemandaComprovacao {
  id: string;
  demandaId: string;
  nomeArquivo: string;
  tipoArquivo: string;
  tamanho: number;
  caminhoArquivo: string;
  descricao?: string;
  autor: string;
  createdAt: string;
}

/** Dados para criar uma comprovação (sem id e createdAt). */
export type DemandaComprovacaoInput = Omit<DemandaComprovacao, "id" | "createdAt">;

export interface DemandaCentroCusto {
  id: string;
  demandaId: string;
  centroDeCusto: string;
  valor: number;
  ordem: number;
}

/** Dados para criar um centro de custo (sem id). */
export type DemandaCentroCustoInput = Omit<DemandaCentroCusto, "id">;

export interface CentroCusto {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt?: string;
}

/** Dados para criar um centro de custo (sem id e timestamps). */
export type CentroCustoInput = Omit<CentroCusto, "id" | "createdAt" | "updatedAt">;

export interface DemandaMensagem {
  id: string;
  demandaId: string;
  mensagem: string;
  autor: string;
  createdAt: string;
}

/** Dados para criar uma mensagem (sem id e createdAt). */
export type DemandaMensagemInput = Omit<DemandaMensagem, "id" | "createdAt">;

/** Códigos de eventos que podem disparar webhook. */
export type WebhookEventCode = "demanda.criada" | "demanda.comprovada";

/** Contato para envio no webhook (ex.: modo WhatsApp). */
export interface WebhookContact {
  phone: string;
  name?: string;
}

/** Configuração global de webhook (uma única linha no sistema). Método sempre POST. */
export interface WebhookConfig {
  id: string;
  url: string;
  enabled: boolean;
  /** Eventos que disparam o webhook. */
  events: WebhookEventCode[];
  /** Modo WhatsApp: quando true, contact_list é enviado no body de todo evento. */
  whatsappMod: boolean;
  /** Lista de contatos enviada como contact_list no body quando whatsappMod está habilitado. */
  contactList: WebhookContact[];
  createdAt?: string;
  updatedAt?: string;
}

/** Dados para salvar a configuração de webhook (sem id e timestamps). */
export type WebhookConfigInput = Omit<WebhookConfig, "id" | "createdAt" | "updatedAt">;
