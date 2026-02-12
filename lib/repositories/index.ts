import type { IUserRepository } from "@/lib/domain/user.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import { UserMockRepository } from "./user-mock.repository";
import { DemandaMockRepository } from "./demanda-mock.repository";
import { SolicitanteMockRepository } from "./solicitante-mock.repository";
import { AgenciaMockRepository } from "./agencia-mock.repository";

/** Factory: retorna o repositório de usuários. Trocar para PrismaRepository quando integrar o banco. */
export function getUserRepository(): IUserRepository {
  return new UserMockRepository();
}

/** Factory: retorna o repositório de demandas. Trocar para PrismaRepository quando integrar o banco. */
export function getDemandaRepository(): IDemandaRepository {
  return new DemandaMockRepository();
}

/** Factory: retorna o repositório de solicitantes. */
export function getSolicitanteRepository(): ISolicitanteRepository {
  return new SolicitanteMockRepository();
}

/** Factory: retorna o repositório de agências. Trocar para PrismaRepository quando integrar o banco. */
export function getAgenciaRepository(): IAgenciaRepository {
  return new AgenciaMockRepository();
}
