import { getSession } from "@/lib/auth";
import { canAccessRoute } from "@/lib/roles";
import { SemPermissao } from "@/components/SemPermissao";

export default async function AgenciasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !canAccessRoute(session.role, "/agencias")) {
    return <SemPermissao />;
  }
  return <>{children}</>;
}
