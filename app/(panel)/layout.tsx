import Link from "next/link";
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
  if (session.mustChangePassword) redirect("/primeiro-acesso");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">
            <span className="text-blue-500">NEXO</span> Tools
          </h1>
          <span className="text-xs text-slate-400">v{APP_VERSION}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex min-w-0 max-w-[min(100%,18rem)] items-center gap-2 text-sm text-slate-600">
            <Link
              href="/perfil"
              title="Meu perfil"
              className="relative size-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 outline-none ring-offset-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {session.avatarKey ? (
                // eslint-disable-next-line @next/next/no-img-element -- mesma origem, ícone pequeno no header
                <img
                  src={`/api/profile/avatar?v=${encodeURIComponent(session.avatarKey)}`}
                  alt=""
                  className="size-full object-cover"
                  width={36}
                  height={36}
                />
              ) : (
                <span className="flex size-full items-center justify-center text-xs font-semibold uppercase leading-none text-slate-500">
                  {session.name.trim().charAt(0) || "?"}
                </span>
              )}
            </Link>
            <span className="truncate">
              Bem-vindo,{" "}
              <span className="font-medium text-slate-800">{session.name}</span>
            </span>
          </div>
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

      <div className="flex flex-1 pt-14">
        <Sidebar role={session.role} />
        <main className="flex-1">
          <ConfirmProvider>{children}</ConfirmProvider>
        </main>
      </div>
      <ToasterProvider />
    </div>
  );
}
