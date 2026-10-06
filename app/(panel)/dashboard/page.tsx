import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/auth";
import { getAgencyDemandaScope } from "@/lib/agency-demanda-scope";
import { currentCapacityYear, getDashboardAgenciasUseCase } from "@/lib/use-cases/get-dashboard-agencias.use-case";
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
import { DashboardEmpty } from "./sub/DashboardCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getSession();
  const agencyScope = await getAgencyDemandaScope(session);

  const agencyParams = agencyScope
    ? { agenciaId: agencyScope.agenciaId, agenciaNomeLegacy: agencyScope.agenciaNomeLegacy }
    : undefined;

  const demandaRepository = getDemandaRepository();
  const agenciaRepository = getAgenciaRepository();
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const isAgencyOnly = session?.role === "agency";
  const year = currentCapacityYear();

  const [dashboardData, unidadesData, comprovacoesData] = await Promise.all([
    getDashboardAgenciasUseCase({ ...agencyParams, year }, {
      demandaRepository,
      agenciaRepository,
    }),
    getDashboardUnidadesUseCase(agencyParams, { demandaRepository }),
    isAgencyOnly && agencyScope
      ? getDemandasComprovacoesAgenciaUseCase(agencyScope, {
          demandaRepository,
          comprovacaoRepository,
        })
      : Promise.resolve(null),
  ]);

  // Agências veem cards bloqueados no lugar dos gráficos e o relatório de comprovações
  if (isAgencyOnly) {
    return (
      <div className="w-full">
        <div className="space-y-6">
          <PageHeader title="Dashboard" description="Acompanhamento das comprovações das suas demandas." />

          {comprovacoesData ? (
            <DashboardComprovacoes data={comprovacoesData} />
          ) : (
            <DashboardEmpty>Carregando relatório de comprovações...</DashboardEmpty>
          )}

          <h2 className="border-t border-neutral-200 pt-6 text-base font-semibold text-neutral-950">
            Faturado vs capacidade anual
          </h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardBlockedCard />
            <DashboardBlockedCard />
          </div>

          <DashboardBlockedCard />
          <DashboardBlockedCard />

          <h2 className="border-t border-neutral-200 pt-6 text-base font-semibold text-neutral-950">
            Por un. responsável
          </h2>
          <DashboardBlockedCard />
        </div>
      </div>
    );
  }

  // Admin e Operator veem o dashboard completo de faturamento
  return (
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader title="Dashboard" description={`Faturado em ${year} vs capacidade anual das agências e totais por unidade.`} />

        <DashboardAgencias data={dashboardData} />

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardChartFaturadoDonut data={dashboardData} />
          <DashboardChartFaturadoVsCapacidade data={dashboardData} />
        </div>

        <DashboardChartUsoPercentual data={dashboardData} />

        <DashboardUnidadesTable data={unidadesData} />
      </div>
    </div>
  );
}
