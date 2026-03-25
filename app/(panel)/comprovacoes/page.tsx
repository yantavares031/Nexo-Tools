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
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const result = await getComprovacoesPaginatedAction(page, DEFAULT_PAGE_SIZE, { q });
  const qValue = (q ?? "").trim();

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

        <form method="GET" className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex-1">
            <label htmlFor="q" className="mb-1.5 block text-xs font-medium text-slate-600">
              Buscar pela descrição
            </label>
            <input
              id="q"
              name="q"
              defaultValue={qValue}
              placeholder="Ex.: impressão, diária, hospedagem..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
          >
            Buscar
          </button>
          {qValue && (
            <Link
              href="/comprovacoes"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Limpar
            </Link>
          )}
        </form>

        <ComprovacoesTable comprovacoes={result.items} userRole={session.role} />

        <ComprovacoesPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          q={qValue || undefined}
        />
      </div>
    </div>
  );
}
