import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canAccessOrdensCompra } from "@/lib/roles";
import { OrdensCompraListBody } from "./sub/OrdensCompraListBody";
import { OrdensCompraContentSkeleton } from "./sub/OrdensCompraContentSkeleton";
import type { OrdensCompraTab } from "./sub/OrdensCompraPagination";
import { Plus, Clock, CheckCircle2 } from "lucide-react";

function parseTab(tabParam: string | undefined): OrdensCompraTab {
  return tabParam === "assinadas" ? "assinadas" : "abertas";
}

export default async function OrdensCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccessOrdensCompra(session.role)) redirect("/");

  const { page: pageParam, q, tab: tabRaw } = await searchParams;
  const tab = parseTab(tabRaw);
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const qValue = (q ?? "").trim();

  const baseQuery = new URLSearchParams();
  if (qValue) baseQuery.set("q", qValue);
  const qSuffix = baseQuery.toString();
  const abertasHref = qSuffix ? `/ordens-compra?${qSuffix}` : "/ordens-compra";
  const assinadasParams = new URLSearchParams(baseQuery);
  assinadasParams.set("tab", "assinadas");
  const assinadasHref = `/ordens-compra?${assinadasParams.toString()}`;
  const limparHref = tab === "assinadas" ? "/ordens-compra?tab=assinadas" : "/ordens-compra";

  const showAdd = session.role === "agency";

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Ordens de compra (OC)</h1>
          {showAdd && (
            <Link
              href="/ordens-compra/adicionar"
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              <Plus className="size-4" />
              Novo pedido
            </Link>
          )}
        </div>

        <p className="text-sm text-slate-600">
          Envie o PDF da OC vinculado a uma demanda. O gerente baixa, assina digitalmente e pode marcar o
          pedido como assinado aqui no sistema.
        </p>

        <div className="flex gap-1 border-b border-slate-200">
          <Link
            href={abertasHref}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === "abertas"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
          >
            <Clock
              className={`size-4 shrink-0 ${tab === "abertas" ? "text-blue-500" : "text-slate-400"}`}
              strokeWidth={tab === "abertas" ? 2.25 : 2}
              aria-hidden
            />
            Em aberto
          </Link>
          <Link
            href={assinadasHref}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === "assinadas"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
          >
            <CheckCircle2
              className={`size-4.5 shrink-0 ${
                tab === "assinadas"
                  ? "text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]"
                  : "text-slate-400"
              }`}
              strokeWidth={tab === "assinadas" ? 2.25 : 2}
              aria-hidden
            />
            Assinadas
          </Link>
        </div>

        <form method="GET" className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4">
          {tab === "assinadas" && <input type="hidden" name="tab" value="assinadas" />}
          <div className="min-w-[200px] flex-1">
            <label htmlFor="q-oc" className="mb-1.5 block text-xs font-medium text-slate-600">
              Buscar por demanda, OC/PI ou arquivo
            </label>
            <input
              id="q-oc"
              name="q"
              defaultValue={qValue}
              placeholder="Ex.: descrição da demanda, código..."
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
              href={limparHref}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Limpar
            </Link>
          )}
        </form>

        <Suspense
          key={`${tab}-${page}-${qValue}`}
          fallback={<OrdensCompraContentSkeleton />}
        >
          <OrdensCompraListBody
            page={page}
            q={qValue}
            tab={tab}
            userRole={session.role}
          />
        </Suspense>
      </div>
    </div>
  );
}
