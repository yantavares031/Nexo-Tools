/**
 * Infra: implementações concretas dos repositórios.
 * Escolhe SQLite ou PostgreSQL conforme ACTIVE_DRIVER_DB.
 * As actions e use cases importam de @/lib/repositories, que reexporta daqui.
 */

import { isPostgres } from "@/lib/infra/db-driver";
import type { IUserRepository } from "@/lib/domain/user.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import type { IDemandaComprovacaoRepository } from "@/lib/domain/demanda-comprovacao.repository";
import type { IDemandaCentroCustoRepository } from "@/lib/domain/demanda-centro-custo.repository";
import type { ICentroCustoRepository } from "@/lib/domain/centro-custo.repository";
import type { IDemandaMensagemRepository } from "@/lib/domain/demanda-mensagem.repository";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";
import type { IDeskfyImportBoardRepository } from "@/lib/domain/deskfy-import-board.repository";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import type { IOrdemCompraRepository } from "@/lib/domain/ordem-compra.repository";

import { UserSqliteRepository } from "./sqlite/user-sqlite.repository";
import { DemandaSqliteRepository } from "./sqlite/demanda-sqlite.repository";
import { SolicitanteSqliteRepository } from "./sqlite/solicitante-sqlite.repository";
import { AgenciaSqliteRepository } from "./sqlite/agencia-sqlite.repository";
import { DemandaComprovacaoSqliteRepository } from "./sqlite/demanda-comprovacao-sqlite.repository";
import { DemandaCentroCustoSqliteRepository } from "./sqlite/demanda-centro-custo-sqlite.repository";
import { CentroCustoSqliteRepository } from "./sqlite/centro-custo-sqlite.repository";
import { DemandaMensagemSqliteRepository } from "./sqlite/demanda-mensagem-sqlite.repository";
import { WebhookConfigSqliteRepository } from "./sqlite/webhook-config-sqlite.repository";
import { DeskfyImportBoardSqliteRepository } from "./sqlite/deskfy-import-board-sqlite.repository";
import { SmtpConfigSqliteRepository } from "./sqlite/smtp-config-sqlite.repository";
import { OrdemCompraSqliteRepository } from "./sqlite/ordem-compra-sqlite.repository";

import { UserPostgresRepository } from "./postgres/user-postgres.repository";
import { DemandaPostgresRepository } from "./postgres/demanda-postgres.repository";
import { SolicitantePostgresRepository } from "./postgres/solicitante-postgres.repository";
import { AgenciaPostgresRepository } from "./postgres/agencia-postgres.repository";
import { DemandaComprovacaoPostgresRepository } from "./postgres/demanda-comprovacao-postgres.repository";
import { DemandaCentroCustoPostgresRepository } from "./postgres/demanda-centro-custo-postgres.repository";
import { CentroCustoPostgresRepository } from "./postgres/centro-custo-postgres.repository";
import { DemandaMensagemPostgresRepository } from "./postgres/demanda-mensagem-postgres.repository";
import { WebhookConfigPostgresRepository } from "./postgres/webhook-config-postgres.repository";
import { DeskfyImportBoardPostgresRepository } from "./postgres/deskfy-import-board-postgres.repository";
import { SmtpConfigPostgresRepository } from "./postgres/smtp-config-postgres.repository";
import { OrdemCompraPostgresRepository } from "./postgres/ordem-compra-postgres.repository";

export { PrepareRepository } from "./prepare.repository";

const pg = isPostgres();

export function getUserRepository(): IUserRepository {
  return pg ? new UserPostgresRepository() : new UserSqliteRepository();
}

export function getDemandaRepository(): IDemandaRepository {
  return pg ? new DemandaPostgresRepository() : new DemandaSqliteRepository();
}

export function getSolicitanteRepository(): ISolicitanteRepository {
  return pg ? new SolicitantePostgresRepository() : new SolicitanteSqliteRepository();
}

export function getAgenciaRepository(): IAgenciaRepository {
  return pg ? new AgenciaPostgresRepository() : new AgenciaSqliteRepository();
}

export function getDemandaComprovacaoRepository(): IDemandaComprovacaoRepository {
  return pg
    ? new DemandaComprovacaoPostgresRepository()
    : new DemandaComprovacaoSqliteRepository();
}

export function getDemandaCentroCustoRepository(): IDemandaCentroCustoRepository {
  return pg
    ? new DemandaCentroCustoPostgresRepository()
    : new DemandaCentroCustoSqliteRepository();
}

export function getCentroCustoRepository(): ICentroCustoRepository {
  return pg ? new CentroCustoPostgresRepository() : new CentroCustoSqliteRepository();
}

export function getDemandaMensagemRepository(): IDemandaMensagemRepository {
  return pg
    ? new DemandaMensagemPostgresRepository()
    : new DemandaMensagemSqliteRepository();
}

export function getWebhookConfigRepository(): IWebhookConfigRepository {
  return pg
    ? new WebhookConfigPostgresRepository()
    : new WebhookConfigSqliteRepository();
}

export function getDeskfyImportBoardRepository(): IDeskfyImportBoardRepository {
  return pg
    ? new DeskfyImportBoardPostgresRepository()
    : new DeskfyImportBoardSqliteRepository();
}

export function getSmtpConfigRepository(): ISmtpConfigRepository {
  return pg ? new SmtpConfigPostgresRepository() : new SmtpConfigSqliteRepository();
}

export function getOrdemCompraRepository(): IOrdemCompraRepository {
  return pg ? new OrdemCompraPostgresRepository() : new OrdemCompraSqliteRepository();
}
