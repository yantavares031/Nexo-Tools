import type { IUserRepository } from "@/lib/domain/user.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import { UserSqliteRepository } from "./user-sqlite.repository";
import { DemandaSqliteRepository } from "./demanda-sqlite.repository";
import { SolicitanteSqliteRepository } from "./solicitante-sqlite.repository";
import { AgenciaSqliteRepository } from "./agencia-sqlite.repository";

/** Factory: retorna o repositório de usuários (SQLite). Trocar para PrismaRepository quando integrar Postgres/MySQL. */
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
