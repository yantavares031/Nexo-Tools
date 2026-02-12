import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { APP_VERSION } from "@/lib/version";
import { Sidebar } from "./sub/Sidebar";
import { ToasterProvider } from "@/components/ToasterProvider";
import { ConfirmProvider } from "@/lib/confirm-context";
import { LogOut } from "lucide-react";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">
            <span className="text-blue-500">NEXO</span> Tools
          </h1>
          <span className="text-xs text-slate-400">v{APP_VERSION}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Bem-vindo,{" "}
            <span className="font-medium text-slate-800">{session.name}</span>
          </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 text-sm text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </form>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar role={session.role} />
        <main className="flex-1">
          <ConfirmProvider>{children}</ConfirmProvider>
        </main>
      </div>
      <ToasterProvider />
    </div>
  );
}
