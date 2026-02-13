/**
 * Infra: implementações concretas dos repositórios (SQLite).
 * As actions e use cases importam de @/lib/repositories, que reexporta daqui.
 */

import type { IUserRepository } from "@/lib/domain/user.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";
import type { IDemandaCentroCustoRepository } from "@/lib/domain/demanda-centro-custo.repository";
import type { ICentroCustoRepository } from "@/lib/domain/centro-custo.repository";
import { UserSqliteRepository } from "./user-sqlite.repository";
import { DemandaSqliteRepository } from "./demanda-sqlite.repository";
import { SolicitanteSqliteRepository } from "./solicitante-sqlite.repository";
import { AgenciaSqliteRepository } from "./agencia-sqlite.repository";
import { DemandaComprovacaoSqliteRepository } from "./demanda-comprovacao-sqlite.repository";
import { DemandaCentroCustoSqliteRepository } from "./demanda-centro-custo-sqlite.repository";
import { CentroCustoSqliteRepository } from "./centro-custo-sqlite.repository";
import { DemandaMensagemSqliteRepository } from "./demanda-mensagem-sqlite.repository";
import type { IDemandaMensagemRepository } from "@/lib/domain/demanda-mensagem.repository";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";
import { WebhookConfigSqliteRepository } from "./webhook-config-sqlite.repository";

/** Factory: retorna o repositório de usuários (SQLite). */
export function getUserRepository(): IUserRepository {
  return new UserSqliteRepository();
}

/** Factory: retorna o repositório de demandas (SQLite). */
export function getDemandaRepository(): IDemandaRepository {
  return new DemandaSqliteRepository();
}

/** Factory: retorna o repositório de solicitantes (SQLite). */
export function getSolicitanteRepository(): ISolicitanteRepository {
  return new SolicitanteSqliteRepository();
}

/** Factory: retorna o repositório de agências (SQLite). */
export function getAgenciaRepository(): IAgenciaRepository {
  return new AgenciaSqliteRepository();
}

/** Factory: retorna o repositório de comprovações de demanda (SQLite). */
export function getDemandaComprovacaoRepository(): IDemandaComprovacaoRepository {
  return new DemandaComprovacaoSqliteRepository();
}

/** Factory: retorna o repositório de centros de custo de demanda (SQLite). */
export function getDemandaCentroCustoRepository(): IDemandaCentroCustoRepository {
  return new DemandaCentroCustoSqliteRepository();
}

/** Factory: retorna o repositório de centros de custo (SQLite). */
export function getCentroCustoRepository(): ICentroCustoRepository {
  return new CentroCustoSqliteRepository();
}

/** Factory: retorna o repositório de mensagens de demanda (SQLite). */
export function getDemandaMensagemRepository(): IDemandaMensagemRepository {
  return new DemandaMensagemSqliteRepository();
}

/** Factory: retorna o repositório de configuração de webhook (SQLite). */
export function getWebhookConfigRepository(): IWebhookConfigRepository {
  return new WebhookConfigSqliteRepository();
}
