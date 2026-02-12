import { Suspense } from "react";
import { listAgenciasUseCase } from "@/lib/use-cases/list-agencias.use-case";
import { getAgenciaRepository } from "@/lib/repositories";
import { AgenciasCards } from "./sub/AgenciasCards";
import { AgenciasHeader } from "./sub/AgenciasHeader";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";

export default async function AgenciasPage() {
  const agenciaRepository = getAgenciaRepository();
  const agencias = await listAgenciasUseCase({ agenciaRepository });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Suspense
          fallback={
            <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
          }
        >
          <AgenciasHeader />
        </Suspense>

        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <AgenciasCards agencias={agencias} />
      </div>
    </div>
  );
}
