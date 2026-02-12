import { getSession } from "@/lib/auth";
import { getDashboardAgenciasUseCase } from "@/lib/use-cases/get-dashboard-agencias.use-case";
import { getDashboardUnidadesUseCase } from "@/lib/use-cases/get-dashboard-unidades.use-case";
import { getDemandaRepository, getAgenciaRepository } from "@/lib/repositories";
import { DashboardAgencias } from "./sub/DashboardAgencias";
import { DashboardChartFaturadoDonut } from "./sub/DashboardChartFaturadoDonut";
import { DashboardChartFaturadoVsCapacidade } from "./sub/DashboardChartFaturadoVsCapacidade";
import { DashboardChartUsoPercentual } from "./sub/DashboardChartUsoPercentual";
import { DashboardUnidadesTable } from "./sub/DashboardUnidadesTable";

export default async function DashboardPage() {
  const session = await getSession();

  const agencyParams =
    session?.role === "agency" && session?.agenciaId
      ? { agenciaId: session.agenciaId }
      : undefined;

  const demandaRepository = getDemandaRepository();
  const agenciaRepository = getAgenciaRepository();

  const [dashboardData, unidadesData] = await Promise.all([
    getDashboardAgenciasUseCase(agencyParams, {
      demandaRepository,
      agenciaRepository,
    }),
    getDashboardUnidadesUseCase(agencyParams, { demandaRepository }),
  ]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Dashboard — Faturado vs Capacidade Anual
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardChartFaturadoDonut data={dashboardData} />
          <DashboardChartFaturadoVsCapacidade data={dashboardData} />
        </div>

        <DashboardChartUsoPercentual data={dashboardData} />

        <DashboardAgencias data={dashboardData} />

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
