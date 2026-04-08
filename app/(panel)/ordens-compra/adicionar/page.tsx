import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canAccessOrdensCompra } from "@/lib/roles";
import { getAgencyDemandaScope } from "@/lib/agency-demanda-scope";
import { getDemandaRepository, getOrdemCompraRepository } from "@/lib/repositories";
import { getDemandasParaNovaOrdemCompraUseCase } from "@/lib/use-cases/get-demandas-para-nova-ordem-compra.use-case";
import { AddOrdemCompraForm } from "./sub/AddOrdemCompraForm";
import { formatMonthYearDisplay } from "@/lib/month-year";
import { ArrowLeft } from "lucide-react";

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

export default async function AdicionarOrdemCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccessOrdensCompra(session.role)) redirect("/");
  if (session.role !== "agency") redirect("/ordens-compra");

  const { mes: mesParam, q } = await searchParams;
  const mesDefault = getDefaultMes();
  const mesParaFiltro = mesParam === "" ? undefined : (mesParam?.trim() || mesDefault);
  const mesOptions = getMesOptions();

  const demandaRepository = getDemandaRepository();
  const ordemCompraRepository = getOrdemCompraRepository();
  const agencyScope = await getAgencyDemandaScope(session);
  const filters = {
    mes: mesParaFiltro,
    search: q?.trim() || undefined,
    agenciaId: agencyScope?.agenciaId,
    agenciaNomeLegacy: agencyScope?.agenciaNomeLegacy,
  };
  const demandas = await getDemandasParaNovaOrdemCompraUseCase(filters, {
    demandaRepository,
    ordemCompraRepository,
  });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/ordens-compra"
            className="flex items-center gap-1 text-sm text-slate-600 transition hover:text-slate-800"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </div>

        <h1 className="text-xl font-semibold text-slate-800">Novo pedido de assinatura de OC</h1>

        <AddOrdemCompraForm
          demandas={demandas}
          mesOptions={mesOptions}
          defaultMes={mesParam === "" ? "" : (mesParam?.trim() || mesDefault)}
          defaultSearch={q ?? ""}
        />
      </div>
    </div>
  );
}
