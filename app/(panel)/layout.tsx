import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { globalSearchAction } from "@/app/actions/search";
import { ToasterProvider } from "@/components/ToasterProvider";
import { ConfirmProvider } from "@/components/confirm-provider";
import { AppFooter } from "@/components/layout/app-footer";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getNavSectionsForRole } from "@/config/navigation";
import { WelcomeReleaseModal } from "@/modals/welcome-release-modal";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/primeiro-acesso");

  const avatarUrl = session.avatarKey
    ? `/api/profile/avatar?v=${encodeURIComponent(session.avatarKey)}`
    : null;

  return (
    <div className="min-h-dvh bg-canvas text-neutral-950 lg:pl-16">
      <Sidebar
        sections={getNavSectionsForRole(session.role ?? "operator")}
        userName={session.name}
        avatarUrl={avatarUrl}
        profileHref="/perfil"
        logoutAction={logoutAction}
      />
      <div className="flex min-h-dvh min-w-0 flex-col">
        <Topbar
          role={session.role ?? "operator"}
          searchAction={globalSearchAction}
          searchPlaceholder="Buscar demanda, solicitante ou página"
          searchDialogPlaceholder="Demanda, OC/PI, solicitante, agência ou página"
        />
        <div className="flex flex-1 flex-col rounded-tl-2xl border-t border-l border-neutral-200/80 bg-white shadow-[0_0_24px_rgba(15,23,42,0.04)] max-lg:rounded-none max-lg:border-l-0">
          <main className="w-full min-w-0 flex-1 px-6 py-8 lg:px-12 lg:py-10">
            <ConfirmProvider>{children}</ConfirmProvider>
          </main>
          <AppFooter />
        </div>
      </div>
      <ToasterProvider />
      <WelcomeReleaseModal userId={session.userId} userName={session.name} role={session.role ?? "operator"} />
    </div>
  );
}
