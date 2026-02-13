import { getSession } from "@/lib/auth";
import { canAccessRoute } from "@/lib/roles";
import { SemPermissao } from "@/components/SemPermissao";

export default async function CentrosCustoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  // Apenas admin e operator podem acessar
  if (!session || !canAccessRoute(session.role, "/centros-custo")) {
    return <SemPermissao />;
  }
  return <>{children}</>;
}
