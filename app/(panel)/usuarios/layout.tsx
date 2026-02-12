import { getSession } from "@/lib/auth";
import { canAccessRoute } from "@/lib/roles";
import { SemPermissao } from "@/components/SemPermissao";

export default async function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !canAccessRoute(session.role, "/usuarios")) {
    return <SemPermissao />;
  }
  return <>{children}</>;
}
