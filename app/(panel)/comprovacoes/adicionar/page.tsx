import { redirect } from "next/navigation";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import { getSession } from "@/lib/auth";
import { getAgencyDemandaScope } from "@/lib/agency-demanda-scope";
import { getDemandaRepository } from "@/lib/repositories";
import { getDemandasParaComprovacaoUseCase } from "@/lib/use-cases/get-demandas-para-comprovacao.use-case";
import { formatMonthYearDisplay } from "@/lib/month-year";
import { PageHeader } from "@/components/layout/page-header";
import { AddComprovacaoForm } from "./sub/AddComprovacaoForm";

function getDefaultMes(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMesOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [{ value: "", label: "Todos" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${y}-${m}`;
    options.push({ value, label: formatMonthYearDisplay(value) });
  }
  return options;
}

export default async function AddComprovacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);

  const { mes: mesParam, q } = await searchParams;
  const mesDefault = getDefaultMes();
  const mesParaFiltro = mesParam === "" ? undefined : (mesParam?.trim() || mesDefault);
  const mesOptions = getMesOptions();

  const demandaRepository = getDemandaRepository();
  const agencyScope = await getAgencyDemandaScope(session);
  const filters = {
    mes: mesParaFiltro,
    search: q?.trim() || undefined,
    agenciaId: agencyScope?.agenciaId,
    agenciaNomeLegacy: agencyScope?.agenciaNomeLegacy,
  };
  const demandas = await getDemandasParaComprovacaoUseCase(filters, { demandaRepository });

  return (
    <div className="w-full">
      <div className="space-y-12">
        <PageHeader
          eyebrow="Comprovações"
          backHref="/comprovacoes"
          title="Nova comprovação"
          description="Envie os arquivos e escolha as demandas que eles comprovam."
        />

        <AddComprovacaoForm
          demandas={demandas}
          mesOptions={mesOptions}
          defaultMes={mesParam === "" ? "" : (mesParam?.trim() || mesDefault)}
          defaultSearch={q ?? ""}
        />
      </div>
    </div>
  );
}
