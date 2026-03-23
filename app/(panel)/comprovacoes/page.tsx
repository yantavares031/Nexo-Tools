import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getComprovacoesPaginatedAction } from "@/app/actions/demanda-comprovacao";
import { ComprovacoesTable } from "./sub/ComprovacoesTable";
import { ComprovacoesPagination } from "./sub/ComprovacoesPagination";
import { Plus } from "lucide-react";

const DEFAULT_PAGE_SIZE = 15;

export default async function ComprovacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const result = await getComprovacoesPaginatedAction(page, DEFAULT_PAGE_SIZE);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Comprovações</h1>
          <Link
            href="/comprovacoes/adicionar"
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            <Plus className="size-4" />
            Adicionar
          </Link>
        </div>

        <ComprovacoesTable comprovacoes={result.items} userRole={session.role} />

        <ComprovacoesPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
        />
      </div>
    </div>
  );
}
