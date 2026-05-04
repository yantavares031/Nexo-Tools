import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAppLogsPageUseCase } from "@/lib/use-cases/get-app-logs-page.use-case";
import { AdminLogsPanel } from "./sub/AdminLogsPanel";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const q = sp.q?.trim() ?? "";

  const data = await getAppLogsPageUseCase({
    page,
    pageSize: 100,
    query: q || undefined,
  });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Logs do sistema</h1>
        <p className="text-sm text-slate-600">
          Logs estruturados (Pino). A tabela mostra data, nível, mensagem e detalhes em formato
          chave/valor (ação, usuário, IP, etc.). Paginação e filtro valem para o trecho lido do
          arquivo (até 32 MB a partir do final, se o arquivo for maior).
        </p>
        <AdminLogsPanel data={data} searchQuery={q} />
      </div>
    </div>
  );
}
