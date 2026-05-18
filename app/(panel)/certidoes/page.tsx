import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCertidoesPaginatedAction } from "@/app/actions/certidao";
import { getAgenciaRepository } from "@/lib/repositories";
import { CertidoesTable } from "./sub/CertidoesTable";
import { CertidoesPagination } from "./sub/CertidoesPagination";
import { CertidoesFilters } from "./sub/CertidoesFilters";
import { Plus } from "lucide-react";

const DEFAULT_PAGE_SIZE = 15;

export default async function CertidoesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; mes?: string; agenciaId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { page: pageParam, q, mes, agenciaId: agenciaIdParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const qValue = (q ?? "").trim();
  const mesValue = (mes ?? "").trim();
  const agenciaIdValue = (agenciaIdParam ?? "").trim();

  const showAgencyFilter = session.role === "admin";

  const result = await getCertidoesPaginatedAction(page, DEFAULT_PAGE_SIZE, {
    q: qValue || undefined,
    mes: mesValue || undefined,
    agenciaId: showAgencyFilter ? agenciaIdValue || undefined : undefined,
  });

  const agencias =
    showAgencyFilter ?
      (await getAgenciaRepository().findAll())
        .map((a) => ({ id: a.id, nomeFantasia: a.nomeFantasia }))
        .sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia, "pt-BR"))
    : [];

  const filterParams = {
    q: qValue || undefined,
    mes: mesValue || undefined,
    agenciaId: showAgencyFilter ? agenciaIdValue || undefined : undefined,
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Certidões</h1>
          <Link
            href="/certidoes/adicionar"
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            <Plus className="size-4" />
            Adicionar
          </Link>
        </div>

        <CertidoesFilters
          defaultQ={qValue}
          defaultMes={mesValue}
          defaultAgenciaId={showAgencyFilter ? agenciaIdValue : ""}
          agencias={agencias}
          hideAgencyFilter={!showAgencyFilter}
        />

        <CertidoesTable certidoes={result.items} userRole={session.role} />

        <CertidoesPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          filters={filterParams}
        />
      </div>
    </div>
  );
}
