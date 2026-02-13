import { getSession } from "@/lib/auth";
import { getDashboardAgenciasUseCase } from "@/lib/use-cases/get-dashboard-agencias.use-case";
import { getDashboardUnidadesUseCase } from "@/lib/use-cases/get-dashboard-unidades.use-case";
import { getDemandasComprovacoesAgenciaUseCase } from "@/lib/use-cases/get-demandas-comprovacoes-agencia.use-case";
import { getDemandaRepository, getAgenciaRepository, getDemandaComprovacaoRepository } from "@/lib/repositories";
import { DashboardAgencias } from "./sub/DashboardAgencias";
import { DashboardChartFaturadoDonut } from "./sub/DashboardChartFaturadoDonut";
import { DashboardChartFaturadoVsCapacidade } from "./sub/DashboardChartFaturadoVsCapacidade";
import { DashboardChartUsoPercentual } from "./sub/DashboardChartUsoPercentual";
import { DashboardUnidadesTable } from "./sub/DashboardUnidadesTable";
import { DashboardComprovacoes } from "./sub/DashboardComprovacoes";
import { DashboardBlockedCard } from "./sub/DashboardBlockedCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getSession();

  const agencyParams =
    session?.role === "agency" && session?.agenciaId
      ? { agenciaId: session.agenciaId }
      : undefined;

  const demandaRepository = getDemandaRepository();
  const agenciaRepository = getAgenciaRepository();
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const isAgencyOnly = session?.role === "agency";

  const [dashboardData, unidadesData, comprovacoesData] = await Promise.all([
    getDashboardAgenciasUseCase(agencyParams, {
      demandaRepository,
      agenciaRepository,
    }),
    getDashboardUnidadesUseCase(agencyParams, { demandaRepository }),
    isAgencyOnly && session?.agenciaId
      ? getDemandasComprovacoesAgenciaUseCase(session.agenciaId, {
          demandaRepository,
          comprovacaoRepository,
        })
      : Promise.resolve(null),
  ]);

  // Agências veem cards bloqueados no lugar dos gráficos e o relatório de comprovações
  if (isAgencyOnly) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <h2 className="text-lg font-semibold text-slate-800">Dashboard</h2>

          {/* Relatório de comprovações - primeiro conteúdo visível para agências */}
          {comprovacoesData ? (
            <DashboardComprovacoes data={comprovacoesData} />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              Carregando relatório de comprovações...
            </p>
          )}

          <hr className="border-slate-200" />

          <h2 className="text-lg font-semibold text-slate-800">
            Dashboard — Faturado vs Capacidade Anual
          </h2>

          {/* Gráficos bloqueados - grid 2 colunas */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardBlockedCard />
            <DashboardBlockedCard />
          </div>

          {/* Gráfico bloqueado - uso percentual */}
          <DashboardBlockedCard />

          {/* Tabela de agências bloqueada */}
          <DashboardBlockedCard />

          <hr className="border-slate-200" />

          {/* Tabela de unidades bloqueada */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-slate-800">
              Por Un. Responsável
            </h2>
            <DashboardBlockedCard />
          </section>
        </div>
      </div>
    );
  }

  // Admin e Operator veem o dashboard completo de faturamento
  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Dashboard — Faturado vs Capacidade Anual
        </h2>

        {/* Tabela de agências primeiro */}
        <DashboardAgencias data={dashboardData} />

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardChartFaturadoDonut data={dashboardData} />
          <DashboardChartFaturadoVsCapacidade data={dashboardData} />
        </div>

        <DashboardChartUsoPercentual data={dashboardData} />

        <hr className="border-slate-200" />

        <section>
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Por Un. Responsável
          </h2>
          <DashboardUnidadesTable data={unidadesData} />
        </section>
      </div>
    </div>
  );
}
