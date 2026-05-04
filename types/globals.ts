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
  /**
   * Senha temporária em texto (primeiro acesso). Quando preenchida, o usuário deve alterar a senha no login.
   * Não expor em props de componentes client.
   */
  temporaryPassword?: string | null;
  /** Chave do objeto no R2 (prefixo `avatars/`). Opcional — foto de perfil. */
  avatarKey?: string | null;
}

/** Usuário sem campos sensíveis (listagens e modais no client). */
export type UserPublic = Omit<User, "password" | "temporaryPassword">;

/** Dados para criar um usuário (sem id). */
export type UserInput = Omit<User, "id">;

/** Dados para editar um usuário. password vazio = mantém a atual. */
export type UserUpdateInput = Omit<User, "id" | "password" | "temporaryPassword"> & {
  password?: string;
  /** null = limpar senha temporária no banco. */
  temporaryPassword?: string | null;
};

export type StatusDemanda = "faturado" | "comprometido" | "entregue";

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
  /** Unidade responsável. Opcional. */
  unResponsavel?: string;
}

/** Dados para criar um solicitante (sem id). */
export type SolicitanteInput = Omit<Solicitante, "id">;

export interface Agencia {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  orcamentoAnual: number;
  /** ID do board Deskfy vinculado (opcional). Relaciona agência ao board para importação. */
  boardId?: string;
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

/** Comprovação (anexo). Pode estar vinculada a uma ou mais demandas via comprovacao_demandas. */
export interface Comprovacao {
  id: string;
  nomeArquivo: string;
  tipoArquivo: string;
  tamanho: number;
  caminhoArquivo: string;
  descricao?: string;
  autor: string;
  /** Usuário que cadastrou a comprovação (foto de perfil na listagem). */
  cadastradoPorUserId?: string | null;
  createdAt: string;
}

/** Dados para criar uma comprovação (sem id e createdAt). */
export type ComprovacaoInput = Omit<Comprovacao, "id" | "createdAt">;

/** @deprecated Use Comprovacao. Mantido para compatibilidade no modal. */
export interface DemandaComprovacao extends Comprovacao {
  demandaId: string;
}

/** @deprecated Use ComprovacaoInput + demandaIds[]. */
export type DemandaComprovacaoInput = ComprovacaoInput & { demandaId: string };

/** Status do fluxo de assinatura da ordem de compra (documento PDF). */
export type OrdemCompraStatus = "em_aberto" | "assinada";

/** Pedido de assinatura de OC: anexo PDF vinculado a uma demanda. */
export interface OrdemCompra {
  id: string;
  demandaId: string;
  nomeArquivo: string;
  tipoArquivo: string;
  tamanho: number;
  caminhoArquivo: string;
  /** PDF assinado pelo admin (só preenchido quando status é assinada). */
  nomeArquivoAssinado?: string;
  tipoArquivoAssinado?: string;
  tamanhoAssinado?: number;
  caminhoArquivoAssinado?: string;
  status: OrdemCompraStatus;
  autor: string;
  /** Usuário que cadastrou o pedido de OC (foto de perfil na listagem). */
  cadastradoPorUserId?: string | null;
  /** E-mail do usuário da agência que enviou a OC (notificação quando assinada). */
  enviadoPorEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Dados para criar uma ordem de compra (timestamps e status fixo em aberto no repositório). */
export type OrdemCompraCreateInput = Pick<
  OrdemCompra,
  | "demandaId"
  | "nomeArquivo"
  | "tipoArquivo"
  | "tamanho"
  | "caminhoArquivo"
  | "autor"
  | "enviadoPorEmail"
  | "cadastradoPorUserId"
> & {
  /** Se informado, o repositório usa este id (ex.: mesmo UUID do path no R2). */
  id?: string;
};

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

/** Configuração SMTP (Gmail e compatíveis) — uma única linha no sistema. */
export interface SmtpConfig {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  /** Senha de app ou credencial SMTP (armazenada no banco). */
  smtpPassword: string;
  enabled: boolean;
  /**
   * E-mails que recebem cópia das notificações de ordem de compra (envio pela agência e OC assinada).
   * Persistido como JSON no banco.
   */
  ordemCompraNotifyEmails: string[];
  updatedAt?: string;
}

/** Dados para a tela de integrações (sem expor senha). */
export interface SmtpConfigPanel {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  enabled: boolean;
  hasPassword: boolean;
  /** Um e-mail por linha (ou separados por vírgula) para a UI. */
  ordemCompraNotifyEmailsText: string;
}

/** Tipos Deskfy (relatórios de workflow). */
export type DeskfyWorkflowPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type DeskfyWorkflowType = "REQUEST" | "TASK" | "SUBTASK" | "TEMPLATE";
export type DeskfyAttachmentType = "privado" | "publico";

export interface DeskfyWorkflowResponsible {
  name?: string | null;
  email?: string | null;
}

export interface DeskfyWorkflowSolicitante {
  id: number;
  name: string;
  perfil: string;
  email: string;
}

export interface DeskfyWorkflowAnexo {
  id?: number;
  name?: string;
  extension?: string;
  contentType?: string;
  isPrivate?: boolean;
  type?: DeskfyAttachmentType | string;
  publicUrl?: string | null;
}

export interface DeskfyWorkflowRespFormularioArquivo {
  id?: number;
  name?: string;
  publicUrl?: string;
}

export interface DeskfyWorkflowRespFormulario {
  campo_codigo?: number;
  campo_nome?: string;
  campo_tipo?: string;
  campo_descricao?: string | null;
  campo_obrigatorio?: boolean;
  campo_arquivado?: boolean;
  resposta?: string | null;
  secao?: { name: string; id: number };
  arquivos?: DeskfyWorkflowRespFormularioArquivo[];
}

export interface DeskfyWorkflowHistoricoColunas {
  taskId?: number;
  coluna_de?: string | null;
  coluna_para?: string | null;
  data_fim?: string | null;
  data_ini?: string;
}

export interface DeskfyWorkflowSolicitacao {
  id: number;
  codigo: string;
  dt_cadastro: string;
  dt_preventrega?: string | null;
  dt_entrega?: string | null;
  status: string;
  titulo?: string | null;
  prioridade: DeskfyWorkflowPriority;
  tipo?: DeskfyWorkflowType | string;
  briefingId: number;
  board?: string | null;
  colunaatual?: string | null;
  ajustes: number;
  formulario: string;
  companyId: number;
  tags: string;
}

export interface DeskfyWorkflowReportItem {
  solicitacao: DeskfyWorkflowSolicitacao;
  responsaveis?: DeskfyWorkflowResponsible[];
  solicitante?: DeskfyWorkflowSolicitante;
  anexos?: DeskfyWorkflowAnexo[];
  resp_formulario?: DeskfyWorkflowRespFormulario[];
  historico_colunas?: DeskfyWorkflowHistoricoColunas[];
}

/** Resposta do endpoint task-details (importação / modal). */
export interface DeskfyTaskDetailsAnexo {
  id: number;
  name?: string;
  extension?: string;
  contentType?: string;
  url?: string;
  isPrivate?: boolean;
  type?: string;
  publicUrl?: string | null;
}

/** Briefing da task: campos dinâmicos + URLs públicas por campo de arquivo. */
export type DeskfyTaskDetailsBriefing = {
  publicUrls?: Record<string, string[]>;
} & Record<string, unknown>;

export interface DeskfyTaskDetailsResponse {
  solicitacao?: Record<string, unknown>;
  responsaveis?: string | null;
  anexos?: DeskfyTaskDetailsAnexo[];
  subtarefas?: unknown;
  briefing?: DeskfyTaskDetailsBriefing | null;
}
