import { getDemandaHistoricoRepository } from "@/lib/repositories";
import type { SessionUser } from "@/lib/auth";
import type { HistoricoDeps } from "@/lib/use-cases/record-demanda-historico.use-case";

export function historicoDepsFromSession(session: SessionUser): HistoricoDeps {
  return {
    repository: getDemandaHistoricoRepository(),
    actor: { name: session.name?.trim() || session.email, userId: session.userId },
  };
}
