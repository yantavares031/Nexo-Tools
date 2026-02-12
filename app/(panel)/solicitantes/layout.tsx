import { getSession } from "@/lib/auth";
import { canAccessRoute } from "@/lib/roles";
import { SemPermissao } from "@/components/SemPermissao";

export default async function SolicitantesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !canAccessRoute(session.role, "/solicitantes")) {
    return <SemPermissao />;
  }
  return <>{children}</>;
}
