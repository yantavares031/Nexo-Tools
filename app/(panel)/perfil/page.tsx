import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserRepository } from "@/lib/repositories";
import { ProfilePanel } from "./sub/ProfilePanel";

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserRepository().findById(session.userId);
  if (!user) redirect("/login");

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Meu perfil</h1>
        <p className="text-sm text-slate-600">
          Atualize seu nome, senha e foto. O e-mail é somente leitura.
        </p>
        <ProfilePanel
          email={user.email}
          defaultName={user.name ?? user.email}
          avatarVersion={user.avatarKey?.trim() ?? ""}
        />
      </div>
    </div>
  );
}
