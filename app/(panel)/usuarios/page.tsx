import { Suspense } from "react";
import { listUsersUseCase } from "@/lib/use-cases/list-users.use-case";
import { listAgenciasUseCase } from "@/lib/use-cases/list-agencias.use-case";
import { getUserRepository } from "@/lib/repositories";
import { getAgenciaRepository } from "@/lib/repositories";
import { UsuariosSection } from "./sub/UsuariosSection";
import { UsuariosHeader } from "./sub/UsuariosHeader";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";
import { sanitizeUserForClient } from "@/lib/sanitize-user";

export default async function UsuariosPage() {
  const userRepository = getUserRepository();
  const agenciaRepository = getAgenciaRepository();
  const [usersRaw, agencias] = await Promise.all([
    listUsersUseCase({ userRepository }),
    listAgenciasUseCase({ agenciaRepository }),
  ]);
  const users = usersRaw.map(sanitizeUserForClient);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <UsuariosHeader agencias={agencias} />

        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <UsuariosSection users={users} agencias={agencias} />
      </div>
    </div>
  );
}
