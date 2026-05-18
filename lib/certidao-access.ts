import type { SessionUser } from "@/lib/auth";
import type { Certidao } from "@/types/globals";
import { getAgencyDemandaScope } from "@/lib/agency-demanda-scope";

/** Verifica se o usuário pode acessar a certidão (download/preview). */
export async function canAccessCertidao(
  session: SessionUser,
  certidao: Certidao
): Promise<boolean> {
  if (session.role === "admin" || session.role === "operator") return true;
  if (session.role !== "agency") return false;
  const scope = await getAgencyDemandaScope(session);
  if (!scope?.agenciaId) return false;
  return certidao.agenciaId === scope.agenciaId;
}
