import { redirect } from "next/navigation";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/auth";
import { getAppLogsPageUseCase } from "@/lib/use-cases/get-app-logs-page.use-case";
import { AdminLogsPanel } from "./sub/AdminLogsPanel";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
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
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader
          title="Logs do sistema"
          description="Logs estruturados (Pino), mais recentes primeiro. Busca e paginação valem para o trecho lido do arquivo (até 32 MB a partir do final)."
        />
        <AdminLogsPanel data={data} searchQuery={q} />
      </div>
    </div>
  );
}
