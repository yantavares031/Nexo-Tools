import { redirect } from "next/navigation";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/auth";
import { getUserRepository } from "@/lib/repositories";
import { ProfilePanel } from "./sub/ProfilePanel";

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);

  const user = await getUserRepository().findById(session.userId);
  if (!user) redirect(SESSION_ENDED_LOGIN_PATH);

  return (
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader
          title="Meu perfil"
          description="Atualize seu nome, senha e foto. O e-mail é somente leitura."
        />
        <ProfilePanel
          email={user.email}
          defaultName={user.name ?? user.email}
          avatarVersion={user.avatarKey?.trim() ?? ""}
        />
      </div>
    </div>
  );
}
