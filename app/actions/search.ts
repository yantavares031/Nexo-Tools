"use server";

import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getAgencyDemandaScope } from "@/lib/agency-demanda-scope";
import { currencyFormat } from "@/lib/format";
import { getAgenciaRepository, getDemandaRepository, getSolicitanteRepository } from "@/lib/repositories";
import { logServerActionError } from "@/lib/server-action-log";
import { globalSearchUseCase } from "@/lib/use-cases/global-search.use-case";
import type { SearchGroup } from "@/components/layout/command-search";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
  entregue: "Entregue",
};

const termSchema = z.string().trim().min(2).max(100);

export async function globalSearchAction(term: string): Promise<SearchGroup[]> {
  const session = await getSession();
  if (!session) return [];

  const parsed = termSchema.safeParse(term);
  if (!parsed.success) return [];

  try {
    const result = await globalSearchUseCase(
      { term: parsed.data, role: session.role, agencyScope: await getAgencyDemandaScope(session) },
      {
        demandaRepository: getDemandaRepository(),
        solicitanteRepository: getSolicitanteRepository(),
        agenciaRepository: getAgenciaRepository(),
      },
    );

    return [
      {
        label: "Demandas",
        items: result.demandas.map((demanda) => ({
          key: `demanda-${demanda.id}`,
          href: `/?q=${encodeURIComponent(demanda.demanda)}`,
          title: demanda.demanda,
          subtitle: [demanda.solicitante, STATUS_LABELS[demanda.status], currencyFormat.format(demanda.valor), demanda.ocPi]
            .filter(Boolean)
            .join(" · "),
        })),
      },
      {
        label: "Solicitantes",
        items: result.solicitantes.map((solicitante) => ({
          key: `solicitante-${solicitante.id}`,
          href: `/solicitantes?q=${encodeURIComponent(solicitante.nome)}`,
          title: solicitante.nome,
          subtitle: solicitante.unResponsavel,
        })),
      },
      {
        label: "Agências",
        items: result.agencias.map((agencia) => ({
          key: `agencia-${agencia.id}`,
          href: `/agencias/${agencia.id}`,
          title: agencia.nomeFantasia,
          subtitle: agencia.cnpj,
        })),
      },
    ];
  } catch (err) {
    await logServerActionError("globalSearchAction", err, { term: parsed.data });
    return [];
  }
}
