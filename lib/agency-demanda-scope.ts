import type { SessionUser } from "@/lib/auth";
import type { Demanda } from "@/types/globals";
import { getAgenciaRepository } from "@/lib/repositories";

/** Filtros de escopo para usuário agency (id + nome fantasia para demandas antigas sem agenciaId). */
export type AgencyDemandaScope = {
  agenciaId: string;
  agenciaNomeLegacy?: string;
};

export async function getAgencyDemandaScope(
  session: SessionUser | null
): Promise<AgencyDemandaScope | undefined> {
  if (!session || session.role !== "agency" || !session.agenciaId) return undefined;
  const agenciaRepository = getAgenciaRepository();
  const ag = await agenciaRepository.findById(session.agenciaId);
  return {
    agenciaId: session.agenciaId,
    agenciaNomeLegacy: ag?.nomeFantasia,
  };
}

export function demandaMatchesAgenciaScope(
  demanda: Demanda,
  scope: AgencyDemandaScope
): boolean {
  if (demanda.agenciaId === scope.agenciaId) return true;
  const idEmpty =
    demanda.agenciaId == null || String(demanda.agenciaId).trim() === "";
  if (
    scope.agenciaNomeLegacy &&
    idEmpty &&
    demanda.agencia === scope.agenciaNomeLegacy
  ) {
    return true;
  }
  return false;
}
